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

router.get('/view', async (_req: Request, res: Response) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Select from view_flight_info
    const flights = await conn.query('SELECT * FROM view_flight_info LIMIT 10');
    
    // Select from view_ticket_info
    const tickets = await conn.query('SELECT * FROM view_ticket_info LIMIT 10');

    res.json({
      flights: flights[0],
      tickets: tickets[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
