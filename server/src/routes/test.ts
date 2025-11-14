import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

router.get("/test-alter", async (req: Request, res: Response) => {
  try {
    const [result] = await pool.query("ALTER TABLE airline ADD COLUMN test_col INT");
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
