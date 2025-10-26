import { Router } from "express";
import { pool } from "../db";

const router = Router();

// Create flight schedule
router.post("/", async (req, res) => {
  const { flight_number, aircraft_type, origin, destination, duration } = req.body;

  await pool.query(
    "INSERT INTO flight_schedules (flight_number, aircraft_type, origin, destination, duration) VALUES (?, ?, ?, ?, ?)",
    [flight_number, aircraft_type, origin, destination, duration]
  );

  res.json({ message: "Flight schedule created" });
});

// Get all schedules
router.get("/", async (_, res) => {
  const [rows] = await pool.query("SELECT * FROM flight_schedules");
  res.json(rows);
});

export default router;
