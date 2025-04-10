const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", { username, password });

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const [rows] = await pool.query("SELECT * FROM admin WHERE username = ?", [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = rows[0];
    if (password !== admin.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ 
      success: true,
      message: "Login successful",
      user: { username: admin.username }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// GET request to fetch customer details

// GET request to fetch customer details
router.get("/customers", async (req, res) => {
    // SQL query to fetch customer details
    const query = `
        SELECT id, username, CONCAT(first_name, ' ', last_name) AS full_name, email, phone_number, is_approved 
        FROM customers;
    `;

    try {
        const [results] = await pool.query(query);  // Use `await` for the promise-based query

        // If no customers are found, return an empty array
        if (results.length === 0) {
            return res.status(404).json({ message: "No customers found" });
        }

        // Return the customer data
        return res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database error", error: err });
    }
});



// PATCH request to update customer status (approve or pending)
router.patch("/customers/:id/status", (req, res) => {
    const customerId = req.params.id; // Get customer ID from URL parameter
    const { is_approved } = req.body; // Get the new status from request body

    // Check if the provided status is valid (either 0 or 1)
    if (is_approved !== 0 && is_approved !== 1) {
        return res.status(400).json({ message: "Invalid status. Must be 0 (pending) or 1 (approved)." });
    }

    // SQL query to update the is_approved field
    const query = "UPDATE customers SET is_approved = ? WHERE id = ?";

    pool.query(query, [is_approved, customerId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        // If no rows were updated, return a message saying the customer wasn't found
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Return a success message
        return res.status(200).json({ message: "Customer status updated successfully" });
    });
});


module.exports = router;