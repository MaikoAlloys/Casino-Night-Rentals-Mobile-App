const jwt = require("jsonwebtoken");
const pool = require("../db"); // Make sure to import your database connection

// Middleware to authenticate customer
const authenticateCustomer = async (req, res, next) => {
  try {
    console.log("🔑 Authorization Header:", req.headers.authorization);

    // Extract token from Authorization header (Bearer <token>)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ error: "No token provided" });
    }

    console.log("🔐 Token Received:", token);

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔓 Decoded Token:", decoded);

    // Verify customer exists in database
    const [customer] = await pool.query("SELECT id FROM customers WHERE id = ?", [decoded.id]);
    if (!customer || customer.length === 0) {
      console.log("❌ Customer not found in database");
      return res.status(404).json({ error: "Customer not found" });
    }

    req.customer = { id: decoded.id };
    console.log("✅ Customer authenticated:", decoded.id);
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("❌ Authentication error:", error);

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    }

    // General error handler for other issues
    res.status(500).json({ error: "Authentication failed" });
  }
};

module.exports = authenticateCustomer;
