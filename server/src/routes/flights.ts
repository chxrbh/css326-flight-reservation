import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket } from "mysql2";

const router = Router();

// List flight schedules (for instance creation and display context)
router.get("/flight-schedules/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid flight ID" });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM flight_schedule WHERE flight_id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Flight schedule not found" });
    }

    res.json(rows[0]);
  } catch (err: any) {
    console.error("GET /flight-schedules/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/flight-schedules", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT fs.flight_id,
              fs.flight_no,
              fs.aircraft_type,
              fs.duration,
              fs.max_seat,
              fs.status,
              al.airline_id,
              al.name             AS airline_name,
              al.airline_iata_code AS airline_code,
              ao.airport_iata_code AS origin_code,
              ad.airport_iata_code AS dest_code
       FROM flight_schedule fs
       JOIN airline al             ON fs.airline_id = al.airline_id
       JOIN airport ao             ON fs.origin_airport_id = ao.airport_id
       JOIN airport ad             ON fs.destination_airport_id = ad.airport_id
       ORDER BY fs.flight_no`
    );
    res.json(rows);
  } catch (err: any) {
    console.error("GET /flight-schedules error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/search", async (req, res) => {
  const { origin_airport_id, destination_airport_id, departure_date } =
    req.query;

  const originId =
    origin_airport_id !== undefined ? Number(origin_airport_id) : undefined;
  const destinationId =
    destination_airport_id !== undefined
      ? Number(destination_airport_id)
      : undefined;

  if (
    origin_airport_id !== undefined &&
    (Number.isNaN(originId) || originId === 0)
  ) {
    return res
      .status(400)
      .json({ error: "origin_airport_id must be a valid number" });
  }

  if (
    destination_airport_id !== undefined &&
    (Number.isNaN(destinationId) || destinationId === 0)
  ) {
    return res
      .status(400)
      .json({ error: "destination_airport_id must be a valid number" });
  }

  const date =
    typeof departure_date === "string" && departure_date.trim()
      ? departure_date.trim()
      : undefined;

  if (
    date &&
    !/^\d{4}-\d{2}-\d{2}$/.test(date) // simple YYYY-MM-DD validation
  ) {
    return res
      .status(400)
      .json({ error: "departure_date must be in YYYY-MM-DD format" });
  }

  const filters: string[] = [];
  const params: Array<number | string> = [];

  if (originId) {
    filters.push("fs.origin_airport_id = ?");
    params.push(originId);
  }

  if (destinationId) {
    filters.push("fs.destination_airport_id = ?");
    params.push(destinationId);
  }

  if (date) {
    filters.push("DATE(fi.departure_datetime) = ?");
    params.push(date);
  }

  try {
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT fi.instance_id,
              fi.flight_id,
              fi.departure_datetime,
              fi.arrival_datetime,
              fi.max_sellable_seat,
              fi.status,
              fi.delayed_min,
              fs.flight_no,
              al.name              AS airline_name,
              al.airline_iata_code AS airline_code,
              ao.airport_id        AS origin_airport_id,
              ao.airport_iata_code AS origin_code,
              ao.name              AS origin_name,
              ad.airport_id        AS destination_airport_id,
              ad.airport_iata_code AS destination_code,
              ad.name              AS destination_name
       FROM flight_instance fi
       JOIN flight_schedule fs ON fi.flight_id = fs.flight_id
       JOIN airline al         ON fs.airline_id = al.airline_id
       JOIN airport ao         ON fs.origin_airport_id = ao.airport_id
       JOIN airport ad         ON fs.destination_airport_id = ad.airport_id
       ${whereClause}
       ORDER BY fi.departure_datetime ASC`,
      params
    );

    res.json(rows);
  } catch (err: any) {
    console.error("GET /search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new flight schedule
router.post("/flight-schedules", async (req, res) => {
  try {
    const {
      flight_no,
      origin_airport_id,
      destination_airport_id,
      aircraft_type,
      duration, // expect HH:MM:SS
      max_seat = null,
      status = "active",
      airline_id,
    } = req.body || {};

    if (
      !flight_no ||
      !origin_airport_id ||
      !destination_airport_id ||
      !airline_id
    ) {
      return res.status(400).json({
        error:
          "flight_no, origin_airport_id, destination_airport_id, airline_id are required",
      });
    }

    // Enforce unique flight_no
    const [dups] = await pool.query(
      `SELECT 1 FROM flight_schedule WHERE flight_no = ? LIMIT 1`,
      [String(flight_no)]
    );
    if ((dups as any[]).length > 0) {
      return res.status(409).json({ error: "Flight number already exists" });
    }

    const [result]: any = await pool.query(
      `INSERT INTO flight_schedule
        (flight_no, origin_airport_id, destination_airport_id, aircraft_type, duration, max_seat, status, airline_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(flight_no),
        Number(origin_airport_id),
        Number(destination_airport_id),
        aircraft_type || null,
        duration || null,
        max_seat,
        status,
        Number(airline_id),
      ]
    );

    const [rows] = await pool.query(
      `SELECT fs.flight_id,
              fs.flight_no,
              fs.aircraft_type,
              fs.duration,
              fs.max_seat,
              fs.status,
              al.airline_id,
              al.name              AS airline_name,
              al.airline_iata_code AS airline_code,
              ao.airport_iata_code AS origin_code,
              ad.airport_iata_code AS dest_code
       FROM flight_schedule fs
       JOIN airline al ON fs.airline_id = al.airline_id
       JOIN airport ao ON fs.origin_airport_id = ao.airport_id
       JOIN airport ad ON fs.destination_airport_id = ad.airport_id
       WHERE fs.flight_id = ?
       LIMIT 1`,
      [result.insertId]
    );

    res.status(201).json((rows as any[])[0]);
  } catch (err: any) {
    console.error("POST /flight-schedules error:", err);
    res.status(500).json({ error: err.message });
  }
});

// List flight instances with schedule context
router.get("/flight-instances", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT fi.instance_id,
              fi.flight_id,
              fi.departure_datetime,
              fi.arrival_datetime,
              fi.max_sellable_seat,
              fi.status,
              fi.delayed_min,
              fs.flight_no,
              al.airline_id,
              al.name              AS airline_name,
              al.airline_iata_code AS airline_code,
              ao.airport_iata_code AS origin_code,
              ad.airport_iata_code AS dest_code
       FROM flight_instance fi
       JOIN flight_schedule fs ON fi.flight_id = fs.flight_id
       JOIN airline al         ON fs.airline_id = al.airline_id
       JOIN airport ao         ON fs.origin_airport_id = ao.airport_id
       JOIN airport ad         ON fs.destination_airport_id = ad.airport_id
       ORDER BY fi.departure_datetime DESC`
    );
    res.json(rows);
  } catch (err: any) {
    console.error("GET /flight-instances error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create flight instance
router.post("/flight-instances", async (req, res) => {
  try {
    const {
      flight_id,
      departure_datetime,
      arrival_datetime,
      status = "on-time",
      max_sellable_seat = null,
      delayed_min = 0,
    } = req.body || {};

    if (!flight_id || !departure_datetime || !arrival_datetime) {
      return res.status(400).json({
        error: "flight_id, departure_datetime, arrival_datetime are required",
      });
    }

    const [result]: any = await pool.query(
      `INSERT INTO flight_instance
       (flight_id, departure_datetime, arrival_datetime, max_sellable_seat, status, delayed_min)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Number(flight_id),
        departure_datetime,
        arrival_datetime,
        max_sellable_seat,
        status,
        delayed_min ?? 0,
      ]
    );

    const [rows] = await pool.query(
      `SELECT fi.instance_id,
              fi.flight_id,
              fi.departure_datetime,
              fi.arrival_datetime,
              fi.max_sellable_seat,
              fi.status,
              fi.delayed_min,
              fs.flight_no,
              al.name              AS airline_name,
              al.airline_iata_code AS airline_code,
              ao.airport_iata_code AS origin_code,
              ad.airport_iata_code AS dest_code
       FROM flight_instance fi
       JOIN flight_schedule fs ON fi.flight_id = fs.flight_id
       JOIN airline al         ON fs.airline_id = al.airline_id
       JOIN airport ao         ON fs.origin_airport_id = ao.airport_id
       JOIN airport ad         ON fs.destination_airport_id = ad.airport_id
       WHERE fi.instance_id = ?
       LIMIT 1`,
      [result.insertId]
    );

    res.status(201).json((rows as any[])[0]);
  } catch (err: any) {
    console.error("POST /flight-instances error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update flight instance (status & delay only)
router.put("/flight-instances/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid instance ID" });
  }

  try {
    const { status, delayed_min } = req.body || {};
    const allowedStatuses = new Set(["on-time", "delayed", "cancelled"]);

    if (!status || !allowedStatuses.has(status)) {
      return res.status(400).json({
        error: "status is required and must be on-time, delayed, or cancelled",
      });
    }

    const [currentRows] = await pool.query<RowDataPacket[]>(
      `SELECT arrival_datetime, COALESCE(delayed_min, 0) AS delayed_min
       FROM flight_instance
       WHERE instance_id = ?
       LIMIT 1`,
      [id]
    );

    if (currentRows.length === 0) {
      return res.status(404).json({ message: "Flight instance not found" });
    }

    const current = currentRows[0];
    const arrivalValue = normalizeToDate(current.arrival_datetime);
    const currentDelay = Number(current.delayed_min ?? 0);

    if (!arrivalValue || Number.isNaN(arrivalValue.getTime())) {
      return res
        .status(500)
        .json({ error: "Invalid stored arrival date for this instance" });
    }

    const scheduledArrival = new Date(arrivalValue);
    if (!Number.isNaN(currentDelay)) {
      scheduledArrival.setMinutes(scheduledArrival.getMinutes() - currentDelay);
    }

    let newDelay = 0;
    const nextArrival = new Date(scheduledArrival);

    if (status === "delayed") {
      if (delayed_min === undefined || delayed_min === null) {
        return res
          .status(400)
          .json({ error: "delayed_min is required when status is delayed" });
      }
      const parsedDelay = Number(delayed_min);
      if (Number.isNaN(parsedDelay) || parsedDelay <= 0) {
        return res
          .status(400)
          .json({ error: "delayed_min must be greater than 0" });
      }
      newDelay = parsedDelay;
      nextArrival.setMinutes(nextArrival.getMinutes() + parsedDelay);
    }

    await pool.query("CALL UpdateFlightStatusAndDelay(?, ?, ?, ?)", [
      id,
      status,
      newDelay,
      formatDateToMySQL(nextArrival),
    ]);

    const [rows] = await pool.query(
      `SELECT fi.instance_id,
              fi.flight_id,
              fi.departure_datetime,
              fi.arrival_datetime,
              fi.max_sellable_seat,
              fi.status,
              fi.delayed_min,
              fs.flight_no,
              al.name              AS airline_name,
              al.airline_iata_code AS airline_code,
              ao.airport_iata_code AS origin_code,
              ad.airport_iata_code AS dest_code
       FROM flight_instance fi
       JOIN flight_schedule fs ON fi.flight_id = fs.flight_id
       JOIN airline al         ON fs.airline_id = al.airline_id
       JOIN airport ao         ON fs.origin_airport_id = ao.airport_id
       JOIN airport ad         ON fs.destination_airport_id = ad.airport_id
       WHERE fi.instance_id = ?
       LIMIT 1`,
      [id]
    );

    res.json((rows as any[])[0]);
  } catch (err: any) {
    console.error("PUT /flight-instances/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

function normalizeToDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  const str = String(value);
  if (!str) return null;
  // MySQL DATETIME comes back as "YYYY-MM-DDTHH:MM:SS.000Z" or "YYYY-MM-DD HH:MM:SS"
  const normalized = str.includes("T") ? str : str.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateToMySQL(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const MM = pad(date.getMinutes());
  const SS = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}

export default router;
