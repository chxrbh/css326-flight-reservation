import { Router } from "express";
import { pool } from "../db";

const router = Router();

const allowedStatuses = ["scheduled", "boarding", "departed", "arrived", "cancelled"];

// ✅ Create flight instance
router.post("/", async (req, res) => {
  const { schedule_id, flight_date, departure_time, arrival_time, status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  await pool.query(
    "INSERT INTO flight_instances (schedule_id, flight_date, departure_time, arrival_time, status) VALUES (?, ?, ?, ?, ?)",
    [schedule_id, flight_date, departure_time, arrival_time, status]
  );
  res.json({ message: "Flight instance created" });
});

// ✅ Get all or filter by status
router.get("/", async (req, res) => {
  const { status } = req.query;
  let sql = "SELECT * FROM flight_instances";
  const params: string[] = [];

  if (status && allowedStatuses.includes(status as string)) {
    sql += " WHERE status = ?";
    params.push(status as string);
  }

  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

export default router;
