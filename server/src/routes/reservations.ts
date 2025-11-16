import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket, OkPacket } from "mysql2";

const router = Router();
const ALLOWED_STATUSES = ["booked", "checked-In", "cancelled"];

router.get("/", async (req, res) => {
  const { airline_id, flight_id, passenger_id, status } = req.query;

  const filters: string[] = [];
  const params: Array<number | string> = [];

  if (typeof airline_id !== "undefined") {
    const id = Number(airline_id);
    if (!id || Number.isNaN(id)) {
      return res
        .status(400)
        .json({ error: "airline_id must be a valid number" });
    }
    filters.push("al.airline_id = ?");
    params.push(id);
  }
  if (typeof flight_id !== "undefined") {
    const id = Number(flight_id);
    if (!id || Number.isNaN(id)) {
      return res
        .status(400)
        .json({ error: "flight_id must be a valid number" });
    }
    filters.push("fs.flight_id = ?");
    params.push(id);
  }
  if (typeof passenger_id !== "undefined") {
    const id = Number(passenger_id);
    if (!id || Number.isNaN(id)) {
      return res
        .status(400)
        .json({ error: "passenger_id must be a valid number" });
    }
    filters.push("p.passenger_id = ?");
    params.push(id);
  }
  if (typeof status !== "undefined") {
    if (typeof status !== "string" || !ALLOWED_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: "status must be booked, checked-In, or cancelled" });
    }
    filters.push("t.status = ?");
    params.push(status);
  }

  try {
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.ticket_id,
              t.ticket_no,
              t.booking_date,
              t.status,
              t.seat,
              t.price_usd,
              p.passenger_id,
              p.first_name,
              p.last_name,
              fi.instance_id,
              fi.departure_datetime,
              fi.arrival_datetime,
              fs.flight_id,
              fs.flight_no,
              al.airline_id,
              al.name              AS airline_name,
              al.airline_iata_code AS airline_code,
              ao.airport_iata_code AS origin_code,
              ao.name              AS origin_name,
              ad.airport_iata_code AS destination_code,
              ad.name              AS destination_name
       FROM ticket t
       JOIN passenger p      ON t.passenger_id = p.passenger_id
       JOIN flight_instance fi ON t.instance_id = fi.instance_id
       JOIN flight_schedule fs ON fi.flight_id = fs.flight_id
       JOIN airline al         ON fs.airline_id = al.airline_id
       JOIN airport ao         ON fs.origin_airport_id = ao.airport_id
       JOIN airport ad         ON fs.destination_airport_id = ad.airport_id
       ${whereClause}
       ORDER BY t.booking_date DESC, t.ticket_id DESC`,
      params
    );
    res.json(rows);
  } catch (err: any) {
    console.error("GET /reservations error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      instance_id,
      passenger_id,
      seat = null,
      price_usd = null,
    } = req.body || {};

    const instanceId = Number(instance_id);
    const passengerId = Number(passenger_id);

    if (!instanceId || Number.isNaN(instanceId)) {
      return res.status(400).json({ error: "instance_id is required" });
    }

    if (!passengerId || Number.isNaN(passengerId)) {
      return res.status(400).json({ error: "passenger_id is required" });
    }

    const [flightRows] = await pool.query<RowDataPacket[]>(
      `SELECT fs.flight_no,
              fi.price_usd,
              fi.departure_datetime,
              fi.arrival_datetime
       FROM flight_instance fi
       JOIN flight_schedule fs ON fi.flight_id = fs.flight_id
       WHERE fi.instance_id = ?
       LIMIT 1`,
      [instanceId]
    );

    if (flightRows.length === 0) {
      return res.status(404).json({ error: "Flight instance not found" });
    }

    const flightNo = String(flightRows[0].flight_no);
    const instancePrice = flightRows[0].price_usd ?? null;
    const departureDateTime = flightRows[0].departure_datetime;
    const arrivalDateTime = flightRows[0].arrival_datetime;
    if (!departureDateTime || !arrivalDateTime) {
      return res
        .status(500)
        .json({ error: "Flight instance is missing scheduling data" });
    }

    const [duplicateRows] = await pool.query<RowDataPacket[]>(
      `SELECT ticket_id
       FROM ticket
       WHERE passenger_id = ?
         AND instance_id = ?
         AND status <> 'cancelled'
       LIMIT 1`,
      [passengerId, instanceId]
    );

    if (duplicateRows.length > 0) {
      return res
        .status(409)
        .json({ error: "Passenger already has a booking for this flight" });
    }

    const [conflictRows] = await pool.query<RowDataPacket[]>(
      `SELECT t.ticket_id,
              fs.flight_no,
              fi.departure_datetime,
              fi.arrival_datetime
       FROM ticket t
       JOIN flight_instance fi ON t.instance_id = fi.instance_id
       JOIN flight_schedule fs ON fi.flight_id = fs.flight_id
       WHERE t.passenger_id = ?
         AND t.status <> 'cancelled'
         AND fi.departure_datetime < ?
         AND fi.arrival_datetime > ?
       ORDER BY fi.departure_datetime ASC
       LIMIT 1`,
      [passengerId, arrivalDateTime, departureDateTime]
    );

    if (conflictRows.length > 0) {
      const conflict = conflictRows[0];
      return res.status(409).json({
        error: `Time conflict with ${conflict.flight_no}`,
        details: {
          ticket_id: conflict.ticket_id,
          departure_datetime: conflict.departure_datetime,
          arrival_datetime: conflict.arrival_datetime,
        },
      });
    }
    const ticketNo = `${flightNo}-${Date.now().toString().slice(-6)}`;
    const bookingDate = new Date().toISOString().slice(0, 10);
    const ticketPrice = price_usd ?? instancePrice;

    const [result]: any = await pool.query(`CALL BookTicket(?, ?, ?, ?, ?)`, [
      ticketNo,
      passengerId,
      instanceId,
      seat ?? null,
      price_usd ?? null,
    ]);
    const ticketId = result[0][0].ticket_id;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.ticket_id,
              t.ticket_no,
              t.booking_date,
              t.status,
              t.seat,
              t.price_usd,
              p.passenger_id,
              p.first_name,
              p.last_name,
              fi.instance_id,
              fi.departure_datetime,
              fi.arrival_datetime,
              fs.flight_id,
              fs.flight_no,
              al.airline_id,
              al.name              AS airline_name,
              al.airline_iata_code AS airline_code,
              ao.airport_iata_code AS origin_code,
              ao.name              AS origin_name,
              ad.airport_iata_code AS destination_code,
              ad.name              AS destination_name
       FROM ticket t
       JOIN passenger p      ON t.passenger_id = p.passenger_id
       JOIN flight_instance fi ON t.instance_id = fi.instance_id
       JOIN flight_schedule fs ON fi.flight_id = fs.flight_id
       JOIN airline al         ON fs.airline_id = al.airline_id
       JOIN airport ao         ON fs.origin_airport_id = ao.airport_id
       JOIN airport ad         ON fs.destination_airport_id = ad.airport_id
       WHERE t.ticket_id = ?
       LIMIT 1`,
      [ticketId]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error("POST /reservations error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:ticketId/status", async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const { status, seat } = req.body || {};

  if (!ticketId || Number.isNaN(ticketId)) {
    return res.status(400).json({ error: "Invalid ticket ID" });
  }

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const updateFields: string[] = ["status = ?"];
    const updateParams: any[] = [status];
    if (typeof seat !== "undefined") {
      updateFields.push("seat = ?");
      updateParams.push(seat || null);
    }

    let result: OkPacket;
    if (status === "cancelled") {
      // Use stored procedure to cancel
      [result] = await pool.query<OkPacket>(`CALL CancelTicket(?)`, [ticketId]);
    } else if (status === "checked-In") {
      // Call stored procedure to check-in + set seat
      [result] = await pool.query<OkPacket>(`CALL CheckInTicket(?, ?)`, [
        ticketId,
        seat || null,
      ]);
      // } else {
      //   // Keep other status updates
      //   [result] = await pool.query<OkPacket>(
      //     `UPDATE ticket SET status = ?, seat = ? WHERE ticket_id = ?`,
      //     [status, seat || null, ticketId]
      //   );
    } else if (status === "booked") {
      const setClause = updateFields.join(", ");
      [result] = await pool.query<OkPacket>(
        `UPDATE ticket SET ${setClause} WHERE ticket_id = ?`,
        [...updateParams, ticketId]
      );
    } else {
      return res.status(400).json({ error: "Invalid ticket status" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.ticket_id,
              t.ticket_no,
              t.booking_date,
              t.status,
              t.seat,
              t.price_usd,
              p.passenger_id,
              p.first_name,
              p.last_name,
              fi.instance_id,
              fi.departure_datetime,
              fi.arrival_datetime,
              fs.flight_id,
              fs.flight_no,
              al.airline_id,
              al.name              AS airline_name,
              al.airline_iata_code AS airline_code,
              ao.airport_iata_code AS origin_code,
              ao.name              AS origin_name,
              ad.airport_iata_code AS destination_code,
              ad.name              AS destination_name
       FROM ticket t
       JOIN passenger p      ON t.passenger_id = p.passenger_id
       JOIN flight_instance fi ON t.instance_id = fi.instance_id
       JOIN flight_schedule fs ON fi.flight_id = fs.flight_id
       JOIN airline al         ON fs.airline_id = al.airline_id
       JOIN airport ao         ON fs.origin_airport_id = ao.airport_id
       JOIN airport ad         ON fs.destination_airport_id = ad.airport_id
       WHERE t.ticket_id = ?
       LIMIT 1`,
      [ticketId]
    );

    res.json(rows[0]);
  } catch (err: any) {
    console.error("PATCH /reservations/:ticketId/status error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
