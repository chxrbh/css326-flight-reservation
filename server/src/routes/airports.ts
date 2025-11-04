import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT airport_id, airport_iata_code, name, city, country FROM airport ORDER BY airport_iata_code`
    );
    res.json(rows);
  } catch (err: any) {
    console.error("GET /airports error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

