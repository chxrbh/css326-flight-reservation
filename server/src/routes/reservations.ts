import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket } from "mysql2";

const router = Router();

router.get("/", async (_req, res) => {
  try {
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
              fs.flight_no,
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
       ORDER BY t.booking_date DESC, t.ticket_id DESC`
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
      passenger_id = 1,
      seat = null,
      price_usd = null,
    } = req.body || {};

    const instanceId = Number(instance_id);
    const passengerId = Number(passenger_id);

    if (!instanceId || Number.isNaN(instanceId)) {
      return res.status(400).json({ error: "instance_id is required" });
    }

    if (!passengerId || Number.isNaN(passengerId)) {
      return res.status(400).json({ error: "passenger_id must be valid" });
    }

    const [flightRows] = await pool.query<RowDataPacket[]>(
      `SELECT fs.flight_no
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
    const ticketNo = `${flightNo}-${Date.now().toString().slice(-6)}`;
    const bookingDate = new Date().toISOString().slice(0, 10);

    const [result]: any = await pool.query(
      `INSERT INTO ticket
         (ticket_no, passenger_id, instance_id, seat, price_usd, booking_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'booked')`,
      [ticketNo, passengerId, instanceId, seat || null, price_usd ?? null, bookingDate]
    );

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
              fs.flight_no,
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
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error("POST /reservations error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
