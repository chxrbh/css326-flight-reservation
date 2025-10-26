import { Router } from "express";
import { pool } from "../db";

const router = Router();

// ✅ Search flight (one-way or round-trip)
router.post("/", async (req, res) => {
  const { tripType, from, to, departure, returnDate, passengers } = req.body;

  try {
    if (tripType === "oneway") {
      const [flights] = await pool.query(
        "SELECT * FROM flight_instances fi JOIN flight_schedules fs ON fi.schedule_id = fs.id WHERE fs.origin = ? AND fs.destination = ? AND fi.flight_date = ?",
        [from, to, departure]
      );
      res.json({ tripType, flights });
    } else if (tripType === "roundtrip") {
      const [outbound] = await pool.query(
        "SELECT * FROM flight_instances fi JOIN flight_schedules fs ON fi.schedule_id = fs.id WHERE fs.origin = ? AND fs.destination = ? AND fi.flight_date = ?",
        [from, to, departure]
      );
      const [returnFlights] = await pool.query(
        "SELECT * FROM flight_instances fi JOIN flight_schedules fs ON fi.schedule_id = fs.id WHERE fs.origin = ? AND fs.destination = ? AND fi.flight_date = ?",
        [to, from, returnDate]
      );
      res.json({ tripType, outbound, returnFlights });
    } else {
      res.status(400).json({ error: "Invalid trip type" });
    }
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
