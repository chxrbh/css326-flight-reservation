import { Router } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../db";

const router = Router();

const normalizeNullableText = (value?: string | null) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
};

router.get("/:id", async (req, res) => {
  const passengerId = Number(req.params.id);
  if (!passengerId || Number.isNaN(passengerId)) {
    return res.status(400).json({ error: "passenger_id must be a number" });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT passenger_id,
              first_name,
              last_name,
              gender,
              DATE_FORMAT(dob, '%Y-%m-%d') AS dob,
              phone,
              nationality,
              account_id
       FROM passenger
       WHERE passenger_id = ?
       LIMIT 1`,
      [passengerId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Passenger not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("GET /passengers/:id error:", error);
    res.status(500).json({ error: "Failed to load passenger profile" });
  }
});

router.put("/:id", async (req, res) => {
  const passengerId = Number(req.params.id);
  if (!passengerId || Number.isNaN(passengerId)) {
    return res.status(400).json({ error: "passenger_id must be a number" });
  }

  const { first_name, last_name, gender = null, dob, phone, nationality } =
    req.body ?? {};

  if (!first_name || !last_name) {
    return res
      .status(400)
      .json({ error: "first_name and last_name are required" });
  }

  if (gender && !["M", "F"].includes(gender)) {
    return res.status(400).json({ error: "gender must be 'M' or 'F'" });
  }

  const normalizedDob = normalizeNullableText(dob);
  const normalizedPhone = normalizeNullableText(phone);
  const normalizedNationality = normalizeNullableText(nationality);

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE passenger
       SET first_name = ?, last_name = ?, gender = ?, dob = ?, phone = ?, nationality = ?
       WHERE passenger_id = ?`,
      [
        first_name.trim(),
        last_name.trim(),
        gender || null,
        normalizedDob,
        normalizedPhone,
        normalizedNationality,
        passengerId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Passenger not found" });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT passenger_id,
              first_name,
              last_name,
              gender,
              DATE_FORMAT(dob, '%Y-%m-%d') AS dob,
              phone,
              nationality,
              account_id
       FROM passenger
       WHERE passenger_id = ?
       LIMIT 1`,
      [passengerId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("PUT /passengers/:id error:", error);
    res.status(500).json({ error: "Failed to update passenger profile" });
  }
});

export default router;
