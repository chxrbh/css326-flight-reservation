import { Router } from "express";
import { pool } from "../db";

const router = Router();

const ADMIN_SELECT = `SELECT aa.employee_id,
                             aa.account_id,
                             aa.first_name,
                             aa.last_name,
                             aa.hire_date,
                             aa.airline_id,
                             al.name              AS airline_name,
                             al.airline_iata_code AS airline_code,
                             acc.email
                      FROM airline_admin aa
                      JOIN account acc ON aa.account_id = acc.account_id
                      JOIN airline al  ON aa.airline_id = al.airline_id`;

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(`${ADMIN_SELECT} ORDER BY al.name, aa.last_name`);
    res.json(rows);
  } catch (err: any) {
    console.error("GET /airline-admins error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { first_name, last_name, email, password, airline_id } = req.body || {};

  if (!first_name || !last_name || !email || !password || !airline_id) {
    return res
      .status(400)
      .json({ error: "first_name, last_name, email, password and airline_id are required" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing]: any = await connection.query(
      "SELECT account_id FROM account WHERE email = ? LIMIT 1",
      [email]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Email already exists" });
    }

    const [airlineRows]: any = await connection.query(
      "SELECT airline_id FROM airline WHERE airline_id = ? LIMIT 1",
      [airline_id]
    );
    if (airlineRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Airline not found" });
    }

    const [accountResult]: any = await connection.query(
      "INSERT INTO account (email, password, access_type) VALUES (?, SHA2(?, 256), 'airline-admin')",
      [email, password]
    );
    const accountId = accountResult.insertId;

    await connection.query(
      "INSERT INTO airline_admin (first_name, last_name, hire_date, airline_id, account_id) VALUES (?, ?, CURDATE(), ?, ?)",
      [first_name, last_name, airline_id, accountId]
    );

    const [rows]: any = await connection.query(
      `${ADMIN_SELECT} WHERE aa.account_id = ? LIMIT 1`,
      [accountId]
    );

    await connection.commit();
    res.status(201).json(rows[0]);
  } catch (err: any) {
    await connection.rollback();
    console.error("POST /airline-admins error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

router.delete("/:accountId", async (req, res) => {
  const accountId = Number(req.params.accountId);
  if (!accountId || Number.isNaN(accountId)) {
    return res.status(400).json({ error: "Invalid account id" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result]: any = await connection.query(
      "DELETE FROM account WHERE account_id = ? AND access_type = 'airline-admin'",
      [accountId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Airline admin account not found" });
    }

    await connection.commit();
    res.status(204).end();
  } catch (err: any) {
    await connection.rollback();
    console.error("DELETE /airline-admins/:accountId error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

export default router;
