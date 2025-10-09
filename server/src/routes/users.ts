import { Router } from "express";
import { pool } from "../db";

const router = Router();

// GET /api/users
router.get("/", async (_req, res) => {
  const [rows] = await pool.query("SELECT id, name, email FROM users ORDER BY id DESC");
  res.json(rows);
});

// POST /api/users {name, email}
router.post("/", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "name and email required" });

  const [result]: any = await pool.execute(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    [name, email]
  );
  const insertedId = result.insertId;
  res.status(201).json({ id: insertedId, name, email });
});

export default router;
