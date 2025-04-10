const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs"); 

// Service Manager login route
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = "SELECT * FROM service_manager WHERE username = ?";
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
        console.error("❌ Error during service manager login:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// GET all dealers
router.get("/dealers", async (req, res) => {
    try {
        const [dealers] = await pool.query("SELECT id, username, first_name, last_name, email, phone_number, created_at FROM dealers");
        res.json({ success: true, dealers });
    } catch (error) {
        console.error("❌ Error fetching dealers:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// GET all approved service bookings
router.get("/approved", async (req, res) => {
    try {
        const [approvedBookings] = await pool.query(
            `SELECT sb.id, sb.customer_id, sb.service_id, sb.event_date, sb.number_of_people, sb.booking_fee, 
                    sb.payment_method, sb.reference_code, sb.status, sb.created_at, 
                    c.first_name, c.last_name, s.name AS service_name
             FROM service_booking sb
             JOIN customers c ON sb.customer_id = c.id
             JOIN services s ON sb.service_id = s.id
             WHERE sb.status = 'approved'`
        );
        res.json({ success: true, approvedBookings });
    } catch (error) {
        console.error("❌ Error fetching approved service bookings:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});



// assigning dealers
router.put("/assign/:bookingId", async (req, res) => {
    const { bookingId } = req.params;
    try {
        const query = "UPDATE service_booking SET status = 'assigned' WHERE id = ?";
        const [result] = await pool.query(query, [bookingId]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: "Booking status updated to assigned" });
        } else {
            res.status(404).json({ success: false, message: "Booking not found" });
        }
    } catch (error) {
        console.error("❌ Error updating booking status:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// Insert dealer assignment
// Insert dealer assignment and update service_booking status to assigned
// Insert dealer assignment and update service_booking status to assigned
router.post("/dealer-assignments", async (req, res) => {
    const { serviceBookingId, dealerId, serviceId, numberOfCustomers } = req.body;
    try {
        // First, check if the service booking is already assigned to a dealer
        const [existingAssignment] = await pool.query(
            "SELECT id FROM dealer_assignments WHERE service_booking_id = ?",
            [serviceBookingId]
        );

        if (existingAssignment.length > 0) {
            return res.status(400).json({ success: false, message: "This service booking is already assigned to a dealer." });
        }

        // Retrieve the service name using the service_id
        const [service] = await pool.query(
            "SELECT name FROM services WHERE id = ?",
            [serviceId]
        );

        if (service.length === 0) {
            return res.status(404).json({ success: false, message: "Service not found." });
        }

        // Insert the dealer assignment into dealer_assignments table
        const query = `
            INSERT INTO dealer_assignments (service_booking_id, dealer_id, service_id, number_of_customers)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [serviceBookingId, dealerId, serviceId, numberOfCustomers]);

        // If the insert is successful, update the status of the service booking to 'assigned'
        if (result.affectedRows > 0) {
            const updateQuery = `
                UPDATE service_booking 
                SET status = 'assigned' 
                WHERE id = ?
            `;
            await pool.query(updateQuery, [serviceBookingId]);

            res.json({ success: true, message: `Dealer assigned successfully for the ${service[0].name} service with ${numberOfCustomers} customers and status updated to assigned.` });
        } else {
            res.status(500).json({ success: false, message: 'Failed to assign dealer' });
        }
    } catch (error) {
        console.error('❌ Error assigning dealer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// Endpoint to fetch Service Manager Profile
router.get('/service-manager', async (req, res) => {
    try {
        const query = 'SELECT id, username, first_name, last_name, email, phone_number FROM service_manager LIMIT 1';
        const [rows] = await pool.execute(query);

        if (rows.length > 0) {
            res.json({ success: true, serviceManager: rows[0] });
        } else {
            res.status(404).json({ success: false, error: 'Service Manager not found' });
        }
    } catch (error) {
        console.error('Error fetching service manager data:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});


// GET /service-manager/feedback
router.get("/feedback", async (req, res) => {
    console.log(`[${new Date().toISOString()}] Fetching feedback for service manager`);
  
    try {
      const [feedbackResults] = await pool.query(
        `SELECT 
           f.feedback_id,
           f.customer_id,
           CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
           f.message,
           f.rating,
           f.created_at,
           f.status,
           f.reply,
           f.reply_by,
           f.reply_time
         FROM feedback f
         JOIN customers c ON f.customer_id = c.id
         WHERE f.service_manager_id IS NOT NULL
         ORDER BY f.created_at DESC`
      );
  
      if (feedbackResults.length === 0) {
        return res.json({
          success: true,
          message: 'No feedback found for service manager',
          feedback: []
        });
      }
  
      res.json({
        success: true,
        feedback: feedbackResults
      });
  
    } catch (error) {
      console.error(`Error fetching service manager feedback:`, error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });
  

  // POST /service-manager/feedback/reply
router.post("/feedback/reply", async (req, res) => {
    const { feedbackId, reply } = req.body;
  
    console.log(`[${new Date().toISOString()}] Service Manager replying to feedback ${feedbackId}`);
  
    if (!feedbackId || !reply) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: feedbackId or reply"
      });
    }
  
    try {
      const [feedbackCheck] = await pool.query(
        `SELECT * FROM feedback 
         WHERE feedback_id = ? AND service_manager_id IS NOT NULL`,
        [feedbackId]
      );
  
      if (feedbackCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found or not assigned to service manager"
        });
      }
  
      await pool.query(
        `UPDATE feedback 
         SET reply = ?, 
             reply_by = 'Service Manager',
             reply_time = NOW(), 
             status = 'resolved'
         WHERE feedback_id = ? AND service_manager_id IS NOT NULL`,
        [reply, feedbackId]
      );
  
      const [updatedFeedback] = await pool.query(
        'SELECT * FROM feedback WHERE feedback_id = ?',
        [feedbackId]
      );
  
      res.json({
        success: true,
        message: "Reply submitted successfully",
        feedback: updatedFeedback[0]
      });
  
    } catch (error) {
      console.error(`Error replying to service manager feedback ${feedbackId}:`, error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
    }
  });
  
module.exports = router;