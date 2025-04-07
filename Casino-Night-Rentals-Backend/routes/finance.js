
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


// Fetch pending service bookings for finance users
router.get("/pending-service-bookings", async (req, res) => {
    try {
        const query = `
            SELECT 
                service_booking.id,  
                services.name AS service_name,
                service_booking.number_of_people,
                CONCAT(customers.first_name, ' ', customers.last_name) AS customer_name,
                service_booking.payment_method,
                service_booking.reference_code,
                service_booking.booking_fee AS amount,
                service_booking.created_at
            FROM service_booking
            JOIN services ON service_booking.service_id = services.id
            JOIN customers ON service_booking.customer_id = customers.id
            WHERE service_booking.status = 'pending'
        `;

        const [serviceBookings] = await pool.query(query);

        if (serviceBookings.length === 0) {
            return res.status(404).json({ 
                success: true,  // Still success=true since no pending bookings isn't an error
                serviceBookings: [],
                message: "No pending service bookings found" 
            });
        }

        res.json({ 
            success: true, 
            serviceBookings 
        });
    } catch (error) {
        console.error("❌ Error fetching pending service bookings:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error",
            error: error.message  // Include error details for debugging
        });
    }
});


// Approve service booking
router.post("/approve-service-booking", async (req, res) => {
    const { service_booking_id } = req.body;

    try {
        // Update the status of the service booking to 'approved'
        const query = `
            UPDATE service_booking
            SET status = 'approved'
            WHERE id = ?
        `;

        const [result] = await pool.query(query, [service_booking_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Service booking not found or already approved" });
        }

        res.json({ success: true, message: "Service booking approved successfully" });
    } catch (error) {
        console.error("❌ Error approving service booking:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});



// Fetch pending customer service payments with store items
router.get("/pending-customer-service-payments", async (req, res) => {
    try {
        const query = `
            SELECT 
                csp.id,
                csp.total_cost,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                s.name AS service_name,
                si.item_name AS store_item_name,
                csp.payment_method,
                csp.reference_code,
                csp.created_at AS payment_date
            FROM customer_service_payment csp
            JOIN customers c ON csp.customer_id = c.id
            JOIN services s ON csp.service_id = s.id
            JOIN dealer_selected_items dsi ON csp.service_booking_id = dsi.service_booking_id
            JOIN store_items si ON dsi.store_item_id = si.id
            WHERE csp.status = 'pending'
        `;

        const [results] = await pool.query(query);

        res.json({ success: true, data: results });
    } catch (error) {
        console.error("❌ Error fetching pending customer service payments:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
});


// Approve customer service payment
router.post("/approve-customer-service-payment", async (req, res) => {
    const { payment_id } = req.body;

    try {
        // Step 1: Update the customer_service_payment status
        const updatePaymentQuery = `
            UPDATE customer_service_payment
            SET status = 'approved'
            WHERE id = ?
        `;
        const [paymentResult] = await pool.query(updatePaymentQuery, [payment_id]);

        if (paymentResult.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Payment not found or already approved" });
        }

        // Step 2: Get the service_booking_id for the payment
        const [[bookingRow]] = await pool.query(
            "SELECT service_booking_id FROM customer_service_payment WHERE id = ?",
            [payment_id]
        );

        if (!bookingRow) {
            return res.status(404).json({ success: false, message: "Service booking not found" });
        }

        const serviceBookingId = bookingRow.service_booking_id;

        // Step 3: Update related dealer_selected_items to approved
        const updateDealerItemsQuery = `
            UPDATE dealer_selected_items
            SET status = 'approved'
            WHERE service_booking_id = ? AND status = 'paid'
        `;
        await pool.query(updateDealerItemsQuery, [serviceBookingId]);

        res.json({ success: true, message: "Customer service payment approved successfully" });
    } catch (error) {
        console.error("❌ Error approving customer service payment:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

module.exports = router;
