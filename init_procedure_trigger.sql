-- Procedures

-- Book a ticket
DELIMITER $$
CREATE PROCEDURE BookTicket (
  IN p_ticket_no VARCHAR(50),
  IN p_passenger_id BIGINT,
  IN p_instance_id BIGINT,
  IN p_seat VARCHAR(10),
  IN p_price_usd DECIMAL(10, 2)
) 
BEGIN
  INSERT INTO
    ticket (
      ticket_no,
      passenger_id,
      instance_id,
      price_usd,
      seat,
      status,
      booking_date
    )
  VALUES (
    p_ticket_no,
    p_passenger_id,
    p_instance_id,
    p_price_usd,
    p_seat,
    'booked',
    CURDATE()
  );

  SELECT
    LAST_INSERT_ID() AS ticket_id;
END $$

DELIMITER ;

-- Cancel a ticket
DELIMITER $$
CREATE PROCEDURE CancelTicket (IN p_ticket_id BIGINT)
BEGIN
  UPDATE ticket
  SET
    status = 'cancelled'
  WHERE
    ticket_id = p_ticket_id;
END $$

DELIMITER ;

-- check-in a ticket
DELIMITER $$
CREATE PROCEDURE CheckInTicket (IN p_ticket_id BIGINT, IN p_seat VARCHAR(10))
BEGIN
  UPDATE ticket
  SET
    status = 'checked-In',
    seat = p_seat
  WHERE
    ticket_id = p_ticket_id;
END $$

DELIMITER ;

-- Update flight instance status
DELIMITER $$
CREATE PROCEDURE UpdateFlightStatusAndDelay (
  IN p_instance_id BIGINT,
  IN p_status ENUM('on-time', 'delayed', 'cancelled'),
  IN p_delayed_min INT,
  IN p_arrival_datetime DATETIME
)
BEGIN
  IF p_status = 'delayed'
     AND (
       p_delayed_min IS NULL
       OR p_delayed_min <= 0
     ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'DELAY_MIN_MUST_BE_POSITIVE';
  END IF;

  UPDATE flight_instance
  SET
    status = p_status,
    delayed_min = p_delayed_min,
    arrival_datetime = p_arrival_datetime
  WHERE
    instance_id = p_instance_id;
END $$

DELIMITER ;

-- Triggers

-- Release gate automatically after flight cancellation
DELIMITER $$
CREATE TRIGGER release_gate_after_cancel
AFTER UPDATE ON flight_instance
FOR EACH ROW
BEGIN
  IF NEW.status = 'cancelled'
     AND OLD.status <> 'cancelled' THEN
    -- Directly delete the gate assignment when flight is cancelled
    DELETE FROM gate_assignment
    WHERE
      instance_id = NEW.instance_id;
  END IF;
END $$

DELIMITER ;

-- Ensure departure is before arrival
DELIMITER $$
CREATE TRIGGER check_flight_times
BEFORE INSERT ON flight_instance
FOR EACH ROW
BEGIN
  IF NEW.departure_datetime >= NEW.arrival_datetime THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Departure must be earlier than arrival';
  END IF;
END $$
DELIMITER ;

-- Ensure gate assignments never overlap for the same gate
DELIMITER $$
CREATE TRIGGER prevent_gate_assignment_conflict_insert
BEFORE INSERT ON gate_assignment
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM gate_assignment ga
    WHERE ga.gate_id = NEW.gate_id
      AND ga.occupy_start_utc < NEW.occupy_end_utc
      AND ga.occupy_end_utc > NEW.occupy_start_utc
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Gate assignment conflict detected';
  END IF;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER prevent_gate_assignment_conflict_update
BEFORE UPDATE ON gate_assignment
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM gate_assignment ga
    WHERE ga.gate_id = NEW.gate_id
      AND ga.assignment_id <> NEW.assignment_id
      AND ga.occupy_start_utc < NEW.occupy_end_utc
      AND ga.occupy_end_utc > NEW.occupy_start_utc
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Gate assignment conflict detected';
  END IF;
END $$
DELIMITER ;
