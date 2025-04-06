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

module.exports = router;
