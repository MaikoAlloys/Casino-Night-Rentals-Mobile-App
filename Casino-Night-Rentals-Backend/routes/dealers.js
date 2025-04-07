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



// GET /dealer/bookings/:dealerId
router.get("/bookings/:dealerId", async (req, res) => {
  const { dealerId } = req.params;
  
  console.log(`[${new Date().toISOString()}] Fetching bookings for dealer: ${dealerId}`);
  
  try {
    // First verify dealer exists
    const [dealerCheck] = await pool.query(
      'SELECT id FROM dealers WHERE id = ?',
      [dealerId]
    );

    if (dealerCheck.length === 0) {
      console.log(`Dealer ${dealerId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Dealer not found' 
      });
    }

    const [results] = await pool.query(
      `SELECT 
         da.id AS assignment_id,
         da.service_booking_id, -- ✅ added service_booking_id here
         sb.id AS booking_id,
         sb.event_date,
         sb.number_of_people,
         sb.customer_id,
         sb.service_id,
         CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
         s.name AS service_name,
         si.id AS store_item_id,
         si.item_name,
         si.item_cost_per_person,
         'Booking fee paid' AS payment_status
       FROM dealer_assignments da
       JOIN service_booking sb ON da.service_booking_id = sb.id
       JOIN customers c ON sb.customer_id = c.id
       JOIN services s ON sb.service_id = s.id
       JOIN store_items si ON si.service_id = s.id
       WHERE da.dealer_id = ? AND da.status = 'pending'`,
      [dealerId]
    );

    console.log(`Found ${results.length} pending bookings for dealer ${dealerId}`);

    if (results.length === 0) {
      console.log(`No pending bookings found for dealer ${dealerId}`);
      return res.json({ 
        success: true, 
        message: 'No bookings found', 
        bookings: [] 
      });
    }

    res.json({ 
      success: true, 
      bookings: results 
    });

  } catch (error) {
    console.error(`Error fetching bookings for dealer ${dealerId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});


// POST /dealer/select-item
router.post("/select-item", async (req, res) => {
  const { 
    store_item_id, 
    service_id, 
    dealer_id, 
    customer_id, 
    item_cost, 
    quantity,
    service_booking_id // 🔥 newly included
  } = req.body;

  console.log(`[${new Date().toISOString()}] Item selection request:`, req.body);

  if (!store_item_id || !service_id || !dealer_id || !customer_id || !service_booking_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields' 
    });
  }

  try {
    // Verify store item exists
    const [itemCheck] = await pool.query(
      'SELECT id FROM store_items WHERE id = ?',
      [store_item_id]
    );
    
    if (itemCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Store item not found' 
      });
    }

    // Insert into dealer_selected_items with service_booking_id
    const [result] = await pool.query(
      `INSERT INTO dealer_selected_items 
       (store_item_id, service_id, dealer_id, customer_id, item_cost, quantity, service_booking_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [store_item_id, service_id, dealer_id, customer_id, item_cost, quantity || 1, service_booking_id]
    );

    console.log(`Item selection recorded with ID: ${result.insertId}`);

    // Update dealer_assignments status to 'submitted'
    await pool.query(
      `UPDATE dealer_assignments 
       SET status = 'submitted' 
       WHERE dealer_id = ? AND service_id = ?`,
      [dealer_id, service_id]
    );

    res.json({ 
      success: true, 
      message: "Store item selected successfully.",
      selectionId: result.insertId
    });

  } catch (error) {
    console.error("Error inserting dealer selected item:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
});


// GET /dealer/profile/:dealerId
router.get("/profile/:dealerId", async (req, res) => {
  const { dealerId } = req.params;

  console.log(`[${new Date().toISOString()}] Fetching profile for dealer: ${dealerId}`);

  try {
    const [rows] = await pool.query(
      `SELECT 
         id, 
         username, 
         CONCAT(first_name, ' ', last_name) AS full_name,
         email, 
         phone_number, 
         created_at 
       FROM dealers 
       WHERE id = ?`,
      [dealerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Dealer not found" 
      });
    }

    res.json({ 
      success: true, 
      dealer: rows[0] 
    });

  } catch (error) {
    console.error(`Error fetching dealer profile for ID ${dealerId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
});


// GET /customer-service-details/:dealerId
router.get("/customer-service-details/:dealerId", async (req, res) => {
  const { dealerId } = req.params;

  console.log(`[${new Date().toISOString()}] Fetching assigned customer service details for dealer: ${dealerId}`);

  try {
    // Confirm dealer exists
    const [dealerCheck] = await pool.query(
      'SELECT id FROM dealers WHERE id = ?',
      [dealerId]
    );

    if (dealerCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }

    // Fetch only services where this dealer is assigned
    const [serviceDetails] = await pool.query(
      `SELECT 
        sb.id AS service_booking_id,
        csp.customer_id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        s.name AS service_name,
        sb.event_date,
        sb.number_of_people,
        csp.status AS payment_status,
        GROUP_CONCAT(si.item_name ORDER BY si.item_name) AS store_items
      FROM dealer_assignments da
      JOIN service_booking sb ON da.service_booking_id = sb.id
      JOIN customer_service_payment csp ON csp.service_booking_id = sb.id
      JOIN customers c ON c.id = csp.customer_id
      JOIN services s ON sb.service_id = s.id
      LEFT JOIN dealer_selected_items dsi ON dsi.service_booking_id = sb.id AND dsi.dealer_id = da.dealer_id
      LEFT JOIN store_items si ON si.id = dsi.store_item_id
      WHERE da.dealer_id = ? AND csp.status = 'released'
      GROUP BY sb.id, csp.customer_id, s.name, sb.event_date, sb.number_of_people
      ORDER BY sb.event_date DESC`,
      [dealerId]
    );

    if (serviceDetails.length === 0) {
      return res.json({
        success: true,
        message: 'No released payments found for this dealer',
        serviceDetails: []
      });
    }

    res.json({
      success: true,
      serviceDetails
    });

  } catch (error) {
    console.error(`Error fetching details for dealer ${dealerId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});


//completing service
// POST /update-status-to-completed
router.post("/update-status-to-completed", async (req, res) => {
  const { dealer_id, payment_id } = req.body;  // Get dealer_id and payment_id from the request body
  
  console.log(`[${new Date().toISOString()}] Dealer ${dealer_id} is updating payment status to 'completed' for paymentId: ${payment_id}`);
  
  if (!payment_id || !dealer_id) {
    return res.status(400).json({
      success: false,
      message: 'Payment ID and Dealer ID are required'
    });
  }

  try {
    // Verify the payment exists and its current status is "released"
    const [paymentCheck] = await pool.query(
      'SELECT id, status FROM customer_service_payment WHERE id = ? AND status = "released"',
      [payment_id]
    );

    if (paymentCheck.length === 0) {
      console.log(`Payment with ID ${payment_id} not found or not in "released" status`);
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found or not in "released" status' 
      });
    }

    // Verify the dealer exists (optional)
    const [dealerCheck] = await pool.query(
      'SELECT id FROM dealers WHERE id = ?',
      [dealer_id]
    );

    if (dealerCheck.length === 0) {
      console.log(`Dealer with ID ${dealer_id} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Dealer not found' 
      });
    }

    // Update the status to "completed"
    const [updateResult] = await pool.query(
      'UPDATE customer_service_payment SET status = "completed" WHERE id = ?',
      [payment_id]
    );

    console.log(`Payment status updated to "completed" for paymentId: ${payment_id}`);

    res.json({
      success: true,
      message: 'Payment status updated to "completed" successfully',
      updatedPaymentId: payment_id,  // Return the updated payment ID
      newStatus: 'completed'  // Return the new status
    });

  } catch (error) {
    console.error(`Error updating payment status for paymentId ${payment_id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});
// GET /dealer/feedback/:dealerId
router.get("/feedback/:dealerId", async (req, res) => {
  const { dealerId } = req.params;

  console.log(`[${new Date().toISOString()}] Fetching feedback for dealer: ${dealerId}`);

  try {
    // Step 1: Confirm dealer exists
    const [dealerCheck] = await pool.query(
      'SELECT id FROM dealers WHERE id = ?',
      [dealerId]
    );

    if (dealerCheck.length === 0) {
      console.log(`Dealer ${dealerId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }

    // Step 2: Fetch feedback sent to this dealer (with customer name)
    const [feedbackResults] = await pool.query(
      `SELECT 
         f.feedback_id,
         f.customer_id,
         f.dealer_id,
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
       WHERE f.dealer_id = ?
       ORDER BY f.created_at DESC`,
      [dealerId]
    );

    if (feedbackResults.length === 0) {
      return res.json({
        success: true,
        message: 'No feedback found for this dealer',
        feedback: []
      });
    }

    res.json({
      success: true,
      feedback: feedbackResults
    });

  } catch (error) {
    console.error(`Error fetching feedback for dealer ${dealerId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});



// POST /dealer/feedback/reply
// POST /dealers/feedback/reply
router.post("/reply", async (req, res) => {
  const { feedbackId, dealerId, reply } = req.body;

  console.log(`[${new Date().toISOString()}] Dealer ${dealerId} replying to feedback ${feedbackId}`);

  if (!feedbackId || !dealerId || !reply) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: feedbackId, dealerId, or reply"
    });
  }

  try {
    // Step 1: Verify dealer exists
    const [dealerCheck] = await pool.query(
      'SELECT id FROM dealers WHERE id = ?',
      [dealerId]
    );

    if (dealerCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found"
      });
    }

    // Step 2: Check if feedback exists and is assigned to this dealer
    const [feedbackCheck] = await pool.query(
      `SELECT * FROM feedback 
       WHERE feedback_id = ? 
       AND (dealer_id = ? OR service_manager_id = ? OR finance_id = ? OR event_manager_id = ?)`,
      [feedbackId, dealerId, dealerId, dealerId, dealerId]
    );

    if (feedbackCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found or not assigned to this dealer"
      });
    }

    // Determine which role column to update
    const feedback = feedbackCheck[0];
    let roleColumn = 'dealer_id';
    if (feedback.service_manager_id === dealerId) roleColumn = 'service_manager_id';
    if (feedback.finance_id === dealerId) roleColumn = 'finance_id';
    if (feedback.event_manager_id === dealerId) roleColumn = 'event_manager_id';

    // Step 3: Update the feedback with the reply
    await pool.query(
      `UPDATE feedback 
       SET reply = ?, 
           reply_by = ?, 
           reply_time = NOW(), 
           status = 'resolved'
       WHERE feedback_id = ? AND ${roleColumn} = ?`,
      [reply, `Dealer ${dealerId}`, feedbackId, dealerId]
    );

    // Get the updated feedback record
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
    console.error(`Error replying to feedback ${feedbackId}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});


module.exports = router;
