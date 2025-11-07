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

// ✅ SIGN IN — checks hashed password
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Compare hashed passwords (SHA2(?, 256))
    const [rows]: any = await pool.query(
      "SELECT * FROM account WHERE email = ? AND password = SHA2(?, 256)",
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const account = rows[0];

    // 2️⃣ Optionally get passenger info
    const [passengerRows]: any = await pool.query(
      "SELECT * FROM passenger WHERE account_id = ?",
      [account.account_id]
    );

    res.json({
      message: "Signin successful",
      account,
      passenger: passengerRows[0] || null,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ error: "Signin failed" });
  }
});

export default router;
