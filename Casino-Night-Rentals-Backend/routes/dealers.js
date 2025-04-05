const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs"); 

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const [dealer] = await pool.query("SELECT * FROM dealers WHERE username = ?", [username]);

    if (dealer.length === 0) {
      return res.status(401).json({ message: "Dealer not found" });
    }

    const validPassword = await bcrypt.compare(password, dealer[0].password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const { password: _, ...dealerInfo } = dealer[0];
    res.status(200).json({ message: "Login successful", dealer: dealerInfo });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
