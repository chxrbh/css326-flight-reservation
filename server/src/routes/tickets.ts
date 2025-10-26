import { Router } from "express";
import { pool } from "../db";

const router = Router();

// ✅ View booked tickets for current user
router.get("/", async (req, res) => {
  const { userId } = req.query; // assumed from login session or JWT later

  const [tickets] = await pool.query(
    "SELECT * FROM tickets WHERE user_id = ?",
    [userId]
  );

  res.json(tickets);
});

export default router;
