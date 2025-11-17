import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import type { PoolConnection } from "mysql2/promise";

const router = Router();
const GATE_BUFFER_BEFORE_MINUTES = 90;
const GATE_BUFFER_AFTER_MINUTES = 15;
const VALID_INSTANCE_STATUSES = ["on-time", "delayed", "cancelled"] as const;

type HttpError = Error & { statusCode?: number };

function createHttpError(statusCode: number, message: string): HttpError {
  const err = new Error(message) as HttpError;
  err.statusCode = statusCode;
  return err;
}

async function getInstanceContext(instanceId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT fi.instance_id,
            fi.flight_id,
            fi.departure_datetime,
            fs.origin_airport_id
     FROM flight_instance fi
     JOIN flight_schedule fs ON fi.flight_id = fs.flight_id
     WHERE fi.instance_id = ?
     LIMIT 1`,
    [instanceId]
  );
  return rows[0];
}

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
              fi.price_usd,
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
       ${whereClause ? `${whereClause} AND` : "WHERE"} fi.status <> 'cancelled'
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
router.get("/flight-instances", async (req, res) => {
  try {
    const statusFilters: string[] = [];
    const rawStatus = req.query.status;
    const rawStatusValues = Array.isArray(rawStatus)
      ? rawStatus
      : rawStatus
        ? [rawStatus]
        : [];
    let flightIdFilter: number | null = null;
    if (req.query.flight_id !== undefined) {
      const parsedFlightId = Number(req.query.flight_id);
      if (Number.isNaN(parsedFlightId) || parsedFlightId <= 0) {
        return res
          .status(400)
          .json({ error: "flight_id must be a valid number" });
      }
      flightIdFilter = parsedFlightId;
    }

    for (const value of rawStatusValues) {
      const normalized = String(value)
        .split(",")
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean);
      statusFilters.push(...normalized);
    }

    if (
      statusFilters.length > 0 &&
      statusFilters.some((status) => !VALID_INSTANCE_STATUSES.includes(status as any))
    ) {
      return res.status(400).json({
        error: "status must be one or more of: on-time, delayed, cancelled",
      });
    }

    const whereClauses: string[] = [];
    const params: Array<string | number> = [];

    if (statusFilters.length) {
      const placeholders = statusFilters.map(() => "?").join(", ");
      whereClauses.push(`fi.status IN (${placeholders})`);
      params.push(...statusFilters);
    }

    if (flightIdFilter !== null) {
      whereClauses.push("fi.flight_id = ?");
      params.push(flightIdFilter);
    }

    const whereClause = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    const [rows] = await pool.query(
      `SELECT fi.instance_id,
              fi.flight_id,
              fi.departure_datetime,
              fi.arrival_datetime,
              fi.price_usd,
              fi.max_sellable_seat,
              fi.status,
              fi.delayed_min,
              fs.flight_no,
              al.airline_id,
              al.name              AS airline_name,
              al.airline_iata_code AS airline_code,
              ao.airport_id        AS origin_airport_id,
              ao.airport_iata_code AS origin_code,
              ao.name              AS origin_name,
              ad.airport_iata_code AS dest_code,
              ad.name              AS destination_name,
              ga.gate_id,
              ga.occupy_start_utc  AS gate_assignment_start,
              ga.occupy_end_utc    AS gate_assignment_end,
              g.gate_code
       FROM flight_instance fi
       JOIN flight_schedule fs ON fi.flight_id = fs.flight_id
       JOIN airline al         ON fs.airline_id = al.airline_id
       JOIN airport ao         ON fs.origin_airport_id = ao.airport_id
       JOIN airport ad         ON fs.destination_airport_id = ad.airport_id
       LEFT JOIN gate_assignment ga ON ga.instance_id = fi.instance_id
       LEFT JOIN gate g             ON ga.gate_id = g.gate_id
       ${whereClause}
       ORDER BY fi.departure_datetime DESC`,
      params
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
      price_usd,
      status = "on-time",
      max_sellable_seat = null,
      delayed_min = 0,
    } = req.body || {};

    if (
      !flight_id ||
      !departure_datetime ||
      !arrival_datetime ||
      price_usd === undefined
    ) {
      return res.status(400).json({
        error:
          "flight_id, departure_datetime, arrival_datetime, price_usd are required",
      });
    }

    const numericPrice = Number(price_usd);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res
        .status(400)
        .json({ error: "price_usd must be a valid non-negative number" });
    }

    const flightIdNum = Number(flight_id);
    if (!flightIdNum || Number.isNaN(flightIdNum)) {
      return res.status(400).json({ error: "flight_id must be a valid number" });
    }

    const parsedDeparture = normalizeToDate(departure_datetime);
    const parsedArrival = normalizeToDate(arrival_datetime);

    if (!parsedDeparture || !parsedArrival) {
      return res
        .status(400)
        .json({ error: "departure_datetime and arrival_datetime must be valid dates" });
    }

    const departureUtc = formatDateToMySQLUTC(parsedDeparture);
    const arrivalUtc = formatDateToMySQLUTC(parsedArrival);

    const [scheduleRows] = await pool.query<RowDataPacket[]>(
      `SELECT origin_airport_id
       FROM flight_schedule
       WHERE flight_id = ?
       LIMIT 1`,
      [flightIdNum]
    );

    if (scheduleRows.length === 0) {
      return res.status(404).json({ error: "Flight schedule not found" });
    }

    const originAirportId = Number(scheduleRows[0].origin_airport_id);

    let connection: PoolConnection | null = null;
    let transactionStarted = false;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO flight_instance
         (flight_id, departure_datetime, arrival_datetime, price_usd, max_sellable_seat, status, delayed_min)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          flightIdNum,
          departureUtc,
          arrivalUtc,
          numericPrice,
          max_sellable_seat,
          status,
          delayed_min ?? 0,
        ]
      );

      const [gateRows] = await connection.query<RowDataPacket[]>(
        `SELECT gate_id
         FROM gate
         WHERE airport_id = ?
           AND status = 'active'
         ORDER BY gate_id
         FOR UPDATE`,
        [originAirportId]
      );

      if (gateRows.length === 0) {
        throw createHttpError(
          409,
          "No active gates available at the origin airport"
        );
      }

      let assignedGateId: number | null = null;

      for (const gate of gateRows) {
        const gateId = Number(gate.gate_id);
        const [conflicts] = await connection.query<RowDataPacket[]>(
          `SELECT 1
           FROM gate_assignment
           WHERE gate_id = ?
             AND occupy_start_utc < DATE_ADD(?, INTERVAL ${GATE_BUFFER_AFTER_MINUTES} MINUTE)
             AND occupy_end_utc > DATE_SUB(?, INTERVAL ${GATE_BUFFER_BEFORE_MINUTES} MINUTE)
           LIMIT 1`,
          [gateId, departureUtc, departureUtc]
        );

        if (conflicts.length === 0) {
          assignedGateId = gateId;
          break;
        }
      }

      if (!assignedGateId) {
        throw createHttpError(
          409,
          "Gate assignment conflict: no gate is free during the requested window"
        );
      }

      await connection.query(
        `INSERT INTO gate_assignment
         (gate_id, instance_id, occupy_start_utc, occupy_end_utc)
         VALUES (
           ?,
           ?,
           DATE_SUB(?, INTERVAL ${GATE_BUFFER_BEFORE_MINUTES} MINUTE),
           DATE_ADD(?, INTERVAL ${GATE_BUFFER_AFTER_MINUTES} MINUTE)
         )`,
        [assignedGateId, result.insertId, departureUtc, departureUtc]
      );

      await connection.commit();

      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT fi.instance_id,
                fi.flight_id,
                fi.departure_datetime,
                fi.arrival_datetime,
                fi.price_usd,
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

      if (rows.length === 0) {
        throw createHttpError(500, "Failed to load created flight instance");
      }

      res.status(201).json(rows[0]);
    } catch (assignmentError: any) {
      if (transactionStarted && connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Rollback error:", rollbackError);
        }
      }

      const statusCode =
        typeof assignmentError?.statusCode === "number"
          ? assignmentError.statusCode
          : 500;
      const message =
        assignmentError instanceof Error
          ? assignmentError.message
          : "Failed to create flight instance";

      if (statusCode >= 500) {
        console.error("POST /flight-instances error:", assignmentError);
      }

      return res.status(statusCode).json({ error: message });
    } finally {
      connection?.release();
    }
  } catch (err: any) {
    console.error("POST /flight-instances error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/flight-instances/:id/gates", async (req, res) => {
  const instanceId = Number(req.params.id);
  if (Number.isNaN(instanceId)) {
    return res.status(400).json({ error: "Invalid instance ID" });
  }

  try {
    const context = await getInstanceContext(instanceId);
    if (!context) {
      return res.status(404).json({ error: "Flight instance not found" });
    }

    const originAirportId = Number(context.origin_airport_id);
    const departureDateTime = context.departure_datetime;

    const [assignmentRows] = await pool.query<RowDataPacket[]>(
      `SELECT assignment_id,
              gate_id,
              occupy_start_utc,
              occupy_end_utc
       FROM gate_assignment
       WHERE instance_id = ?
       LIMIT 1`,
      [instanceId]
    );
    const assignment = assignmentRows[0] ?? null;

    const [gateRows] = await pool.query<RowDataPacket[]>(
      `SELECT g.gate_id,
              g.gate_code,
              g.status,
              NOT EXISTS (
                SELECT 1
                FROM gate_assignment ga2
                WHERE ga2.gate_id = g.gate_id
                  AND ga2.instance_id <> ?
                  AND ga2.occupy_start_utc < DATE_ADD(?, INTERVAL ${GATE_BUFFER_AFTER_MINUTES} MINUTE)
                  AND ga2.occupy_end_utc > DATE_SUB(?, INTERVAL ${GATE_BUFFER_BEFORE_MINUTES} MINUTE)
              ) AS is_available
       FROM gate g
       WHERE g.airport_id = ?
         AND g.status = 'active'
       ORDER BY g.gate_code ASC`,
      [instanceId, departureDateTime, departureDateTime, originAirportId]
    );

    res.json({
      instance_id: instanceId,
      origin_airport_id: originAirportId,
      current_gate_id: assignment?.gate_id ?? null,
      occupy_start_utc: assignment?.occupy_start_utc ?? null,
      occupy_end_utc: assignment?.occupy_end_utc ?? null,
      gates: gateRows.map((gate) => ({
        gate_id: Number(gate.gate_id),
        gate_code: gate.gate_code,
        status: gate.status,
        is_available: Boolean(gate.is_available),
      })),
    });
  } catch (err: any) {
    console.error("GET /flight-instances/:id/gates error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/flight-instances/:id/gate", async (req, res) => {
  const instanceId = Number(req.params.id);
  if (Number.isNaN(instanceId)) {
    return res.status(400).json({ error: "Invalid instance ID" });
  }

  const gateIdRaw = req.body?.gate_id;
  const gateId = Number(gateIdRaw);
  if (!gateId || Number.isNaN(gateId)) {
    return res.status(400).json({ error: "gate_id is required" });
  }

  try {
    const context = await getInstanceContext(instanceId);
    if (!context) {
      return res.status(404).json({ error: "Flight instance not found" });
    }

    const originAirportId = Number(context.origin_airport_id);
    const departureDateTime = context.departure_datetime;

    let connection: PoolConnection | null = null;
    let transactionStarted = false;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      const [gateRows] = await connection.query<RowDataPacket[]>(
        `SELECT gate_id, status
         FROM gate
         WHERE gate_id = ?
           AND airport_id = ?
         FOR UPDATE`,
        [gateId, originAirportId]
      );

      if (gateRows.length === 0) {
        throw createHttpError(
          404,
          "Gate not found for the flight's origin airport"
        );
      }

      if (gateRows[0].status !== "active") {
        throw createHttpError(409, "Gate is not active");
      }

      const [conflicts] = await connection.query<RowDataPacket[]>(
        `SELECT 1
         FROM gate_assignment
         WHERE gate_id = ?
           AND instance_id <> ?
           AND occupy_start_utc < DATE_ADD(?, INTERVAL ${GATE_BUFFER_AFTER_MINUTES} MINUTE)
           AND occupy_end_utc > DATE_SUB(?, INTERVAL ${GATE_BUFFER_BEFORE_MINUTES} MINUTE)
         LIMIT 1
         FOR UPDATE`,
        [gateId, instanceId, departureDateTime, departureDateTime]
      );

      if (conflicts.length > 0) {
        throw createHttpError(
          409,
          "Gate assignment conflict: chosen gate is not available"
        );
      }

      await connection.query(
        `INSERT INTO gate_assignment
         (gate_id, instance_id, occupy_start_utc, occupy_end_utc)
         VALUES (
           ?,
           ?,
           DATE_SUB(?, INTERVAL ${GATE_BUFFER_BEFORE_MINUTES} MINUTE),
           DATE_ADD(?, INTERVAL ${GATE_BUFFER_AFTER_MINUTES} MINUTE)
         )
         ON DUPLICATE KEY UPDATE
           gate_id = VALUES(gate_id),
           occupy_start_utc = VALUES(occupy_start_utc),
           occupy_end_utc = VALUES(occupy_end_utc)`,
        [gateId, instanceId, departureDateTime, departureDateTime]
      );

      await connection.commit();

      const [updatedRows] = await pool.query<RowDataPacket[]>(
        `SELECT ga.assignment_id,
                ga.gate_id,
                ga.occupy_start_utc,
                ga.occupy_end_utc,
                g.gate_code
         FROM gate_assignment ga
         JOIN gate g ON ga.gate_id = g.gate_id
         WHERE ga.instance_id = ?
         LIMIT 1`,
        [instanceId]
      );

      res.json(updatedRows[0]);
    } catch (err: any) {
      if (transactionStarted && connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Rollback error:", rollbackError);
        }
      }

      const statusCode =
        typeof err?.statusCode === "number" ? err.statusCode : 500;
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update gate assignment";

      if (statusCode >= 500) {
        console.error("PUT /flight-instances/:id/gate error:", err);
      }
      return res.status(statusCode).json({ error: message });
    } finally {
      connection?.release();
    }
  } catch (outerErr: any) {
    console.error("PUT /flight-instances/:id/gate error:", outerErr);
    res.status(500).json({ error: outerErr.message });
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
      formatDateToMySQLUTC(nextArrival),
    ]);

    const [rows] = await pool.query(
      `SELECT fi.instance_id,
              fi.flight_id,
              fi.departure_datetime,
              fi.arrival_datetime,
              fi.price_usd,
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

function formatDateToMySQLUTC(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const HH = pad(date.getUTCHours());
  const MM = pad(date.getUTCMinutes());
  const SS = pad(date.getUTCSeconds());
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}

export default router;
