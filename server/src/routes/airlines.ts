import { Router } from "express";
import { pool } from "../db";

const router = Router();

// ✅ GET /api/airlines
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT airline_id, name, airline_iata_code, country, support_email, support_phone FROM airline ORDER BY name"
    );
    res.json(rows);
  } catch (err: any) {
    console.error("GET /airlines error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST /api/airlines
router.post("/", async (req, res) => {
  try {
    const { name, code, country, supportEmail, supportPhone } = req.body;
    if (!name || !code)
      return res
        .status(400)
        .json({ error: "name and airline_iata_code required" });

    const [result]: any = await pool.query(
      "INSERT INTO airline (name, airline_iata_code, country, support_email, support_phone) VALUES (?, ?, ?, ?, ?)",
      [name, code.toUpperCase(), country || null, supportEmail || null, supportPhone || null]
    );

    const [rows] = await pool.query(
      "SELECT * FROM airline WHERE airline_id = ?",
      [result.insertId]
    );
    res.status(201).json((rows as any[])[0]);
  } catch (err: any) {
    console.error("POST /airlines error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE /api/airlines/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM airline WHERE airline_id = ?", [id]);
    res.status(204).end();
  } catch (err: any) {
    console.error("DELETE /airlines error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

// Update airline
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, country, supportEmail, supportPhone } = req.body;

    if (!name || !code) {
      return res
        .status(400)
        .json({ error: "name and airline_iata_code required" });
    }

    await pool.query(
      "UPDATE airline SET name = ?, airline_iata_code = ?, country = ?, support_email = ?, support_phone = ? WHERE airline_id = ?",
      [name, String(code).toUpperCase(), country || null, supportEmail || null, supportPhone || null, id]
    );

    const [rows] = await pool.query(
      "SELECT airline_id, name, airline_iata_code, country, support_email, support_phone FROM airline WHERE airline_id = ?",
      [id]
    );

    const row = (rows as any[])[0];
    if (!row) return res.status(404).json({ error: "Airline not found" });

    res.json(row);
  } catch (err: any) {
    console.error("PUT /airlines/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});
