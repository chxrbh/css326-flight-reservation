import { Router } from "express";
import { pool } from "../db";
import { ResultSetHeader } from "mysql2";

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
      [
        name,
        code.toUpperCase(),
        country || null,
        supportEmail || null,
        supportPhone || null,
      ]
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
  // If airline_id is INT, coerce and validate the param
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid airline_id" });
  }

  const { name, code, country, supportEmail, supportPhone } = req.body;
  if (!name || !code) {
    return res
      .status(400)
      .json({ error: "name and airline_iata_code required" });
  }

  let conn: any;
  try {
    conn = await pool.getConnection(); // use ONE connection
    await conn.beginTransaction();

    const [upd] = await conn.query(
      // 👉 If you can, schema-qualify: `mydb.airline`
      "UPDATE airline SET name = ?, airline_iata_code = ?, country = ?, support_email = ?, support_phone = ? WHERE airline_id = ?",
      [
        name,
        String(code).toUpperCase(),
        country || null,
        supportEmail || null,
        supportPhone || null,
        id,
      ]
    );

    const { affectedRows } = upd as ResultSetHeader;
    if (affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Airline not found" });
    }

    const [rows] = await conn.query(
      "SELECT airline_id, name, airline_iata_code, country, support_email, support_phone FROM airline WHERE airline_id = ? LIMIT 1",
      [id]
    );

    await conn.commit();

    const row = (rows as any[])[0];
    // Defensive: in case of race/trigger
    if (!row) return res.status(404).json({ error: "Airline not found" });

    return res.status(200).json(row);
  } catch (err: any) {
    if (conn)
      try {
        await conn.rollback();
      } catch {}
    console.error("PUT /airlines/:id error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release?.();
  }
});
