
const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs"); 

// Fetch pending payments for finance users
router.get("/pending-payments", async (req, res) => {
    try {
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
            WHERE payments.status = 'pending'
        `;

        const [payments] = await pool.query(query);

        if (payments.length === 0) {
            return res.status(404).json({ error: "No pending payments found" });
        }

        res.json({ success: true, payments });
    } catch (error) {
        console.error("❌ Error fetching pending payments:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});



// Backend route for getting payment details
router.get('/payment-details/:id', async (req, res) => {
    try {
        const paymentId = req.params.id;
        
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


//approve product payment
router.post("/approve-payment", async (req, res) => {
    const { payment_id } = req.body;

    try {
        // Update the status of the payment to 'approved'
        const query = `
            UPDATE payments 
            SET status = 'approved'
            WHERE id = ?
        `;
        
        const [result] = await pool.query(query, [payment_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Payment not found or already approved" });
        }

        res.json({ success: true, message: "Payment approved successfully" });
    } catch (error) {
        console.error("❌ Error approving payment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// Finance login route
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = "SELECT * FROM finance WHERE username = ?";
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


// Route to get finance profile information
router.get('/profile', async (req, res) => {
    try {
        const query = 'SELECT id, username, first_name, last_name, email, phone_number FROM finance LIMIT 1';
        const [rows] = await pool.execute(query);

        if (rows.length > 0) {
            res.json({ success: true, profile: rows[0] });
        } else {
            res.status(404).json({ success: false, error: 'Profile not found' });
        }
    } catch (error) {
        console.error('Error fetching finance profile:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});


module.exports = router;
