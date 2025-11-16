-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 09, 2025 at 07:55 AM
-- Server version: 5.7.24
-- PHP Version: 8.3.1
SET
  SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET
  time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;

/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;

/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;

/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `css326_project_airport_new`
--
-- --------------------------------------------------------
--
-- Table structure for table `account`
--
CREATE TABLE `account` (
  `account_id` bigint(20) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `access_type` enum('passenger', 'airline-admin', 'super-admin') NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

--
-- Dumping data for table `account`
--
-- TO DO: Passwords should be hashed in production systems.
INSERT INTO `account` (`account_id`, `email`, `password`, `access_type`) VALUES
(1, 'john.doe@gmail.com', SHA2('pass1234', 256), 'passenger'),
(2, 'jane.airline@skyasia.com', SHA2('admin1234', 256), 'airline-admin'),
(3, 'admin@system.com', SHA2('rootpass', 256), 'super-admin');

-- --------------------------------------------------------
--
-- Table structure for table `airline`
--
CREATE TABLE `airline` (
  `airline_id` int(11) NOT NULL,
  `airline_iata_code` varchar(3) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `support_email` varchar(50) DEFAULT NULL,
  `support_phone` varchar(50) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

--
-- Dumping data for table `airline`
--
INSERT INTO
  `airline` (
    `airline_id`,
    `airline_iata_code`,
    `name`,
    `country`,
    `support_email`,
    `support_phone`
  )
VALUES
  (
    1,
    'SA',
    'SkyAsia Airlines',
    'Thailand',
    'support@skyasia.com',
    '+6621112222'
  ),
  (
    2,
    'PG',
    'Pacific Green',
    'Singapore',
    'help@pacificgreen.sg',
    '+6565555555'
  );

-- --------------------------------------------------------
--
-- Table structure for table `airline_admin`
--
CREATE TABLE `airline_admin` (
  `employee_id` int(11) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `airline_id` int(11) NOT NULL,
  `account_id` bigint(20) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

--
-- Dumping data for table `airline_admin`
--
INSERT INTO
  `airline_admin` (
    `employee_id`,
    `first_name`,
    `last_name`,
    `hire_date`,
    `airline_id`,
    `account_id`
  )
VALUES
  (1, 'Jane', 'Airline', '2023-01-05', 1, 2);

-- --------------------------------------------------------
--
-- Table structure for table `airport`
--
CREATE TABLE `airport` (
  `airport_id` int(11) NOT NULL,
  `airport_iata_code` varchar(3) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `timezone` varchar(10) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

--
-- Dumping data for table `airport`
--
INSERT INTO
  `airport` (
    `airport_id`,
    `airport_iata_code`,
    `name`,
    `city`,
    `country`,
    `timezone`
  )
VALUES
  (
    1,
    'BKK',
    'Suvarnabhumi Airport',
    'Bangkok',
    'Thailand',
    'UTC+7'
  ),
  (
    2,
    'SIN',
    'Changi Airport',
    'Singapore',
    'Singapore',
    'UTC+8'
  ),
  (
    3,
    'HND',
    'Haneda Airport',
    'Tokyo',
    'Japan',
    'UTC+9'
  );

-- --------------------------------------------------------
--
-- Table structure for table `flight_instance`
--
CREATE TABLE `flight_instance` (
  `instance_id` bigint(20) NOT NULL,
  `flight_id` int(11) NOT NULL,
  `departure_datetime` datetime DEFAULT NULL,
  `arrival_datetime` datetime DEFAULT NULL,
  `price_usd` DECIMAL(10,2) NOT NULL,
  `max_sellable_seat` int(11) DEFAULT NULL,
  `status` enum('on-time', 'delayed', 'cancelled') DEFAULT 'on-time',
  `delayed_min` int(11) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

--
-- Dumping data for table `flight_instance`
--

INSERT INTO `flight_instance` (`instance_id`, `flight_id`, `departure_datetime`, `arrival_datetime`, `price_usd`, `max_sellable_seat`, `status`, `delayed_min`) VALUES
(1, 1, '2025-10-10 09:00:00', '2025-10-10 11:30:00', 120.00, 175, 'on-time', 0),
(2, 1, '2025-10-11 09:00:00', '2025-10-11 11:35:00', 125.00, 175, 'delayed', 5),
(3, 2, '2025-10-10 15:00:00', '2025-10-10 17:20:00', 118.00, 180, 'on-time', 0),
(4, 3, '2025-10-10 06:00:00', '2025-10-10 11:50:00', 350.00, 195, 'cancelled', 0);

-- --------------------------------------------------------
--
-- Table structure for table `flight_schedule`
--
CREATE TABLE `flight_schedule` (
  `flight_id` int(11) NOT NULL,
  `flight_no` varchar(10) NOT NULL,
  `origin_airport_id` int(11) NOT NULL,
  `destination_airport_id` int(11) NOT NULL,
  `aircraft_type` varchar(20) DEFAULT NULL,
  `duration` time DEFAULT NULL,
  `max_seat` int(11) DEFAULT NULL,
  `status` enum('active', 'cancelled') DEFAULT 'active',
  `airline_id` int(11) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

--
-- Dumping data for table `flight_schedule`
--
INSERT INTO
  `flight_schedule` (
    `flight_id`,
    `flight_no`,
    `origin_airport_id`,
    `destination_airport_id`,
    `aircraft_type`,
    `duration`,
    `max_seat`,
    `status`,
    `airline_id`
  )
VALUES
  (
    1,
    'SA101',
    1,
    2,
    'Airbus A320',
    '02:30:00',
    180,
    'active',
    1
  ),
  (
    2,
    'SA102',
    2,
    1,
    'Airbus A320',
    '02:20:00',
    180,
    'active',
    1
  ),
  (
    3,
    'PG330',
    1,
    3,
    'Boeing 737',
    '05:50:00',
    200,
    'active',
    2
  );

-- --------------------------------------------------------
--
-- Table structure for table `gate`
--
CREATE TABLE `gate` (
  `gate_id` int(11) NOT NULL,
  `airport_id` int(11) NOT NULL,
  `gate_code` varchar(12) DEFAULT NULL,
  `status` enum('active', 'closed', 'maintenance') DEFAULT 'active'
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

--
-- Dumping data for table `gate`
--
INSERT INTO
  `gate` (`gate_id`, `airport_id`, `gate_code`, `status`)
VALUES
  (1, 1, 'A1', 'active'),
  (2, 1, 'A2', 'active'),
  (3, 2, 'B5', 'active'),
  (4, 3, 'C7', 'maintenance');

-- --------------------------------------------------------
--
-- Table structure for table `gate_assignment`
--
CREATE TABLE `gate_assignment` (
  `assignment_id` bigint(20) NOT NULL,
  `gate_id` int(11) NOT NULL,
  `instance_id` bigint(20) NOT NULL,
  `occupy_start_utc` datetime NOT NULL,
  `occupy_end_utc` datetime NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

--
-- Dumping data for table `gate_assignment`
--
INSERT INTO
  `gate_assignment` (
    `assignment_id`,
    `gate_id`,
    `instance_id`,
    `occupy_start_utc`,
    `occupy_end_utc`
  )
VALUES
  (
    1,
    1,
    1,
    '2025-10-10 07:30:00',
    '2025-10-10 09:15:00'
  ),
  (
    2,
    1,
    2,
    '2025-10-11 07:30:00',
    '2025-10-11 09:20:00'
  ),
  (
    3,
    2,
    3,
    '2025-10-10 13:30:00',
    '2025-10-10 15:15:00'
  ),
  (
    4,
    3,
    4,
    '2025-10-10 04:30:00',
    '2025-10-10 06:15:00'
  );

-- --------------------------------------------------------
--
-- Table structure for table `passenger`
--
CREATE TABLE `passenger` (
  `passenger_id` bigint(20) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `gender` enum('M', 'F') DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `account_id` bigint(20) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

--
-- Dumping data for table `passenger`
--

INSERT INTO `passenger` (`passenger_id`, `first_name`, `last_name`, `gender`, `dob`, `phone`, `nationality`, `account_id`) VALUES
(1, 'John', 'Doe', 'M', '1995-04-23', '+66891234567', 'Thai', 1);

-- --------------------------------------------------------
--
-- Table structure for table `ticket`
--
CREATE TABLE `ticket` (
  `ticket_id` bigint(20) NOT NULL,
  `ticket_no` varchar(50) DEFAULT NULL,
  `passenger_id` bigint(20) NOT NULL,
  `instance_id` bigint(20) NOT NULL,
  `seat` varchar(10) DEFAULT NULL,
  `price_usd` decimal(8, 2) DEFAULT NULL,
  `booking_date` date DEFAULT NULL,
  `status` enum('booked', 'checked-In', 'cancelled') DEFAULT 'booked'
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

--
-- Dumping data for table `ticket`
--
INSERT INTO
  `ticket` (
    `ticket_id`,
    `ticket_no`,
    `passenger_id`,
    `instance_id`,
    `seat`,
    `price_usd`,
    `booking_date`,
    `status`
  )
VALUES
  (
    1,
    'SA101-001',
    1,
    1,
    '12A',
    120.00,
    '2025-10-05',
    'booked'
  ),
  (
    2,
    'SA101-002',
    1,
    2,
    '14C',
    125.00,
    '2025-10-06',
    'booked'
  ),
  (
    3,
    'SA102-001',
    1,
    3,
    '10B',
    118.00,
    '2025-10-07',
    'checked-In'
  ),
  (
    4,
    'PG330-001',
    1,
    4,
    '22A',
    350.00,
    '2025-10-08',
    'cancelled'
  );

--
-- Indexes for dumped tables
--
--
-- Indexes for table `account`
--
ALTER TABLE `account`
ADD PRIMARY KEY (`account_id`),
ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `airline`
--
ALTER TABLE `airline`
ADD PRIMARY KEY (`airline_id`),
ADD UNIQUE KEY `iata_code` (`airline_iata_code`);

--
-- Indexes for table `airline_admin`
--
ALTER TABLE `airline_admin`
ADD PRIMARY KEY (`employee_id`),
ADD KEY `airline_id` (`airline_id`),
ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `airport`
--
ALTER TABLE `airport`
ADD PRIMARY KEY (`airport_id`),
ADD UNIQUE KEY `iata_code` (`airport_iata_code`);

--
-- Indexes for table `flight_instance`
--
ALTER TABLE `flight_instance`
ADD PRIMARY KEY (`instance_id`),
ADD KEY `flight_id` (`flight_id`);

--
-- Indexes for table `flight_schedule`
--
ALTER TABLE `flight_schedule`
ADD PRIMARY KEY (`flight_id`),
ADD KEY `airline_id` (`airline_id`),
ADD KEY `origin_airport_id` (`origin_airport_id`),
ADD KEY `destination_airport_id` (`destination_airport_id`);

--
-- Indexes for table `gate`
--
ALTER TABLE `gate`
ADD PRIMARY KEY (`gate_id`),
ADD KEY `airport_id` (`airport_id`);

--
-- Indexes for table `gate_assignment`
--
ALTER TABLE `gate_assignment`
ADD PRIMARY KEY (`assignment_id`),
ADD UNIQUE KEY `uq_ga_instance_unique` (`instance_id`),
ADD KEY `idx_ga_gate_window` (`gate_id`, `occupy_start_utc`, `occupy_end_utc`);

--
-- Indexes for table `passenger`
--
ALTER TABLE `passenger`
ADD PRIMARY KEY (`passenger_id`),
ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `ticket`
--
ALTER TABLE `ticket`
ADD PRIMARY KEY (`ticket_id`),
ADD UNIQUE KEY `ticket_no` (`ticket_no`),
ADD KEY `passenger_id` (`passenger_id`),
ADD KEY `instance_id` (`instance_id`);

--
-- AUTO_INCREMENT for dumped tables
--
--
-- AUTO_INCREMENT for table `account`
--
ALTER TABLE `account`
MODIFY `account_id` bigint(20) NOT NULL AUTO_INCREMENT,
AUTO_INCREMENT = 4;

--
-- AUTO_INCREMENT for table `airline`
--
ALTER TABLE `airline`
MODIFY `airline_id` int(11) NOT NULL AUTO_INCREMENT,
AUTO_INCREMENT = 3;

--
-- AUTO_INCREMENT for table `airline_admin`
--
ALTER TABLE `airline_admin`
MODIFY `employee_id` int(11) NOT NULL AUTO_INCREMENT,
AUTO_INCREMENT = 2;

--
-- AUTO_INCREMENT for table `airport`
--
ALTER TABLE `airport`
MODIFY `airport_id` int(11) NOT NULL AUTO_INCREMENT,
AUTO_INCREMENT = 4;

--
-- AUTO_INCREMENT for table `flight_instance`
--
ALTER TABLE `flight_instance`
MODIFY `instance_id` bigint(20) NOT NULL AUTO_INCREMENT,
AUTO_INCREMENT = 5;

--
-- AUTO_INCREMENT for table `flight_schedule`
--
ALTER TABLE `flight_schedule`
MODIFY `flight_id` int(11) NOT NULL AUTO_INCREMENT,
AUTO_INCREMENT = 4;

--
-- AUTO_INCREMENT for table `gate`
--
ALTER TABLE `gate`
MODIFY `gate_id` int(11) NOT NULL AUTO_INCREMENT,
AUTO_INCREMENT = 5;

--
-- AUTO_INCREMENT for table `gate_assignment`
--
ALTER TABLE `gate_assignment`
MODIFY `assignment_id` bigint(20) NOT NULL AUTO_INCREMENT,
AUTO_INCREMENT = 5;

--
-- AUTO_INCREMENT for table `passenger`
--
ALTER TABLE `passenger`
MODIFY `passenger_id` bigint(20) NOT NULL AUTO_INCREMENT,
AUTO_INCREMENT = 3;

--
-- AUTO_INCREMENT for table `ticket`
--
ALTER TABLE `ticket`
MODIFY `ticket_id` bigint(20) NOT NULL AUTO_INCREMENT,
AUTO_INCREMENT = 5;

--
-- Constraints for dumped tables
--
--
-- Constraints for table `airline_admin`
--
ALTER TABLE `airline_admin`
ADD CONSTRAINT `airline_admin_ibfk_1` FOREIGN KEY (`airline_id`) REFERENCES `airline` (`airline_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `airline_admin_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `flight_instance`
--
ALTER TABLE `flight_instance`
ADD CONSTRAINT `flight_instance_ibfk_1` FOREIGN KEY (`flight_id`) REFERENCES `flight_schedule` (`flight_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `flight_schedule`
--
ALTER TABLE `flight_schedule`
ADD CONSTRAINT `flight_schedule_ibfk_1` FOREIGN KEY (`airline_id`) REFERENCES `airline` (`airline_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `flight_schedule_ibfk_2` FOREIGN KEY (`origin_airport_id`) REFERENCES `airport` (`airport_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `flight_schedule_ibfk_3` FOREIGN KEY (`destination_airport_id`) REFERENCES `airport` (`airport_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `gate`
--
ALTER TABLE `gate`
ADD CONSTRAINT `gate_ibfk_1` FOREIGN KEY (`airport_id`) REFERENCES `airport` (`airport_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `gate_assignment`
--
ALTER TABLE `gate_assignment`
ADD CONSTRAINT `fk_ga_gate` FOREIGN KEY (`gate_id`) REFERENCES `gate` (`gate_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `fk_ga_instance` FOREIGN KEY (`instance_id`) REFERENCES `flight_instance` (`instance_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `passenger`
--
ALTER TABLE `passenger`
ADD CONSTRAINT `passenger_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ticket`
--
ALTER TABLE `ticket`
ADD CONSTRAINT `ticket_ibfk_1` FOREIGN KEY (`passenger_id`) REFERENCES `passenger` (`passenger_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `ticket_ibfk_2` FOREIGN KEY (`instance_id`) REFERENCES `flight_instance` (`instance_id`) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;

/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;

/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- 3 Stored Procedures
-- 1️⃣ Book a ticket
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

-- 2️⃣ Cancel a ticket
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

-- 3️⃣ Update flight instance status
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

-- 3 Triggers
-- 1️⃣ Release gate automatically after flight cancellation
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

-- REMOVED
-- -- 2️⃣ Auto-close gate after assignment
-- DELIMITER $$
-- CREATE TRIGGER update_gate_status_after_assignment_insert
-- AFTER INSERT ON gate_assignment
-- FOR EACH ROW
-- BEGIN
--     UPDATE gate
--     SET status = 'closed'
--     WHERE gate_id = NEW.gate_id;
-- END$$
-- DELIMITER ;
-- 3️⃣ Prevent invalid flight times
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
-- Step 1: Create the user
CREATE USER 'webuser'@'localhost' IDENTIFIED BY 'webuser';

-- Step 2: Grant limited privileges
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON css326_project_airport_new.* TO 'webuser'@'localhost';

-- Step 3: Apply changes

FLUSH PRIVILEGES;
