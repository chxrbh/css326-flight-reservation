import { Router } from "express";
import { pool } from "../db";

const router = Router();

// ✅ Sign up (first_name, last_name, email, password)
router.post("/signup", async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  try {
    const [result]: any = await pool.query(
      "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)",
      [first_name, last_name, email, password]
    );
    res.json({ message: "Signup successful", userId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// ✅ Sign in (check email/password)
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [user]: any = await pool.query(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );

    if (!user || user.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    res.json({ message: "Signin successful", user });
  } catch (error) {
    res.status(500).json({ error: "Signin failed" });
  }
});

export default router;
