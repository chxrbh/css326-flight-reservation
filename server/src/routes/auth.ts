import { Router } from "express";
import { pool } from "../db";

const router = Router();

// ✅ SIGN UP — inserts into both `account` and `passenger`
router.post("/signup", async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1️⃣ Check for duplicate email
    const [existing]: any = await connection.query(
      "SELECT * FROM account WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Email already exists" });
    }

    // 2️⃣ Insert into account table — hash password using SHA2(?, 256)
    const [accountResult]: any = await connection.query(
      "INSERT INTO account (email, password, access_type) VALUES (?, SHA2(?, 256), 'passenger')",
      [email, password]
    );

    const accountId = accountResult.insertId;

    // 3️⃣ Insert into passenger table (linked by account_id)
    await connection.query(
      "INSERT INTO passenger (first_name, last_name, account_id) VALUES (?, ?, ?)",
      [first_name, last_name, accountId]
    );

    await connection.commit();
    res.json({ message: "Signup successful", accountId });
  } catch (error) {
    await connection.rollback();
    console.error("Signup error:", error);
    res.status(500).json({ error: "Signup failed" });
  } finally {
    connection.release();
  }
});

// ✅ SIGN IN — checks hashed password (supports legacy plaintext seeds)
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Compare hashed passwords (SHA2(?, 256)) but also allow legacy plaintext rows
    // so that seed data from init_local.sql continues to work.
    const [rows]: any = await pool.query(
      `SELECT acc.*, aa.airline_id
       FROM account acc
       LEFT JOIN airline_admin aa ON acc.account_id = aa.account_id
       WHERE acc.email = ?
         AND (acc.password = SHA2(?, 256) OR acc.password = ?)`,
      [email, password, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const account = rows[0];
    let passenger = null;

    if (account.access_type === "passenger") {
      const [passengerRows]: any = await pool.query(
        "SELECT * FROM passenger WHERE account_id = ? LIMIT 1",
        [account.account_id]
      );
      passenger = passengerRows[0] || null;
    }

    res.json({
      message: "Signin successful",
      account,
      passenger,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ error: "Signin failed" });
  }
});

// ✅ PROFILE — fetch account details + role-specific data
router.get("/profile/:accountId", async (req, res) => {
  const accountId = Number(req.params.accountId);
  if (!accountId || Number.isNaN(accountId)) {
    return res.status(400).json({ error: "Invalid account id" });
  }

  try {
    const [accountRows]: any = await pool.query(
      "SELECT account_id, email, access_type FROM account WHERE account_id = ? LIMIT 1",
      [accountId]
    );

    if (accountRows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    const account = accountRows[0];
    let passenger: any = null;
    let airlineAdmin: any = null;

    if (account.access_type === "passenger") {
      const [rows]: any = await pool.query(
        "SELECT * FROM passenger WHERE account_id = ? LIMIT 1",
        [accountId]
      );
      passenger = rows[0] || null;
    }

    if (account.access_type === "airline-admin") {
      const [rows]: any = await pool.query(
        `SELECT aa.*, al.name AS airline_name, al.airline_iata_code AS airline_code
         FROM airline_admin aa
         JOIN airline al ON aa.airline_id = al.airline_id
         WHERE aa.account_id = ?
         LIMIT 1`,
        [accountId]
      );
      airlineAdmin = rows[0] || null;
    }

    res.json({ account, passenger, airlineAdmin });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
