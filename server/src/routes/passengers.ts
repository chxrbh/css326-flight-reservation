import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/:id", async (req, res) => {
  const passengerId = Number(req.params.id);
  if (!passengerId || Number.isNaN(passengerId)) {
    return res.status(400).json({ error: "passenger_id must be a number" });
  }

  const [rows]: any = await pool.query(
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
});

router.put("/:id", async (req, res) => {
  const passengerId = Number(req.params.id);
  if (!passengerId || Number.isNaN(passengerId)) {
    return res.status(400).json({ error: "passenger_id must be a number" });
  }

  const {
    first_name,
    last_name,
    gender = null,
    dob = null,
    phone = null,
    nationality = null,
  } = req.body;

  if (!first_name || !last_name) {
    return res
      .status(400)
      .json({ error: "first_name and last_name are required" });
  }

  if (gender && !["M", "F"].includes(gender)) {
    return res.status(400).json({ error: "gender must be 'M' or 'F'" });
  }

  const [result]: any = await pool.query(
    `UPDATE passenger
     SET first_name = ?, last_name = ?, gender = ?, dob = ?, phone = ?, nationality = ?
     WHERE passenger_id = ?`,
    [first_name, last_name, gender, dob, phone, nationality, passengerId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: "Passenger not found" });
  }

  const [rows]: any = await pool.query(
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
});

export default router;
