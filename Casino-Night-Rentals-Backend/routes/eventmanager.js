const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs"); 


// Event Manager login route
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = "SELECT * FROM event_manager WHERE username = ?";
        const [users] = await pool.query(query, [username]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const user = users[0];

        // Compare the hashed password with the provided password
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (isPasswordMatch) {
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("❌ Error during login:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// Fetch all approved payments with customer & product details
router.get("/approved-payments", async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id AS payment_id,
                c.first_name AS customer_first_name,
                c.last_name AS customer_last_name,
                pr.name AS product_name,
                oi.quantity,
                p.created_at
            FROM payments p
            JOIN customers c ON p.customer_id = c.id
            LEFT JOIN order_items oi ON p.id = oi.payment_id
            LEFT JOIN products pr ON oi.product_id = pr.id
            LEFT JOIN event_product_booking epb ON p.id = epb.payment_id  -- Ensure payment_id is not in event_product_booking
            WHERE p.status = 'approved' 
            AND oi.product_id IS NOT NULL 
            AND epb.payment_id IS NULL  -- Exclude records already reserved in event_product_booking
        `;

        const [results] = await pool.query(query);
        console.log("Fetched Payments:", results); // Debugging Log
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("❌ Error fetching approved payments:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// Endpoint to reserve the item
router.post("/reserve-item", async (req, res) => {
    try {
        const { payment_id } = req.body;
        
        const query = `
            INSERT INTO event_product_booking (customer_id, product_id, payment_id, status)
            SELECT customer_id, product_id, ?, 'reserved'
            FROM payments
            JOIN order_items ON payments.id = order_items.payment_id
            WHERE payments.id = ?
        `;
        
        const [result] = await pool.query(query, [payment_id, payment_id]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: "Item reserved successfully" });
        } else {
            res.status(400).json({ success: false, message: "Failed to reserve item" });
        }
    } catch (error) {
        console.error("❌ Error reserving item:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Backend route for fetching payment details for event manager
router.get('/payment-details/:payment_id', async (req, res) => {
    try {
        const paymentId = req.params.payment_id;
        
        const query = `
            SELECT 
                payments.id AS payment_id,
                payments.total_amount AS amount_paid,
                payments.reference_code AS reference,
                customers.first_name,
                customers.last_name,
                products.name AS product_name
            FROM payments
            JOIN customers ON payments.customer_id = customers.id
            JOIN order_items ON payments.id = order_items.payment_id
            JOIN products ON order_items.product_id = products.id
            WHERE payments.id = ?
        `;
        
        const [paymentDetails] = await pool.query(query, [paymentId]);

        if (paymentDetails.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Payment not found' 
            });
        }

        // Return the payment details
        res.json({ 
            success: true, 
            payment: paymentDetails[0]  // Send the first result as the payment data
        });
    } catch (error) {
        console.error("❌ Error fetching payment details:", error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});



// Endpoint to fetch event manager data
router.get('/event-manager', async (req, res) => {
    try {
      
        const query = 'SELECT id, username, first_name, last_name, email, phone_number FROM event_manager LIMIT 1';
        const [rows] = await pool.execute(query);

    
        if (rows.length > 0) {
            res.json({ success: true, eventManager: rows[0] });
        } else {
            res.status(404).json({ success: false, error: 'Event Manager not found' });
        }
    } catch (error) {
        console.error('Error fetching event manager data:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

module.exports = router;
