const express = require('express');
const router = express.Router();
const pool = require('../db'); // adjust path as needed
const bcrypt = require("bcryptjs"); 
// Storekeeper login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await pool.query(
      "SELECT * FROM storekeeper WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = users[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          full_name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone_number: user.phone_number,
          created_at: user.created_at
        }
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }

  } catch (error) {
    console.error("❌ Storekeeper login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// GET /storekeeper/products
router.get("/products", async (req, res) => {
    try {
      const [products] = await pool.query(
        "SELECT id, name, quantity, rental_price, image_url FROM products"
      );
  
      res.json({ success: true, products });
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  
  // GET /storekeeper/store-items
router.get("/store-items", async (req, res) => {
    try {
      const [items] = await pool.query(`
        SELECT 
          si.id, 
          si.service_id, 
          s.name AS service_name,
          si.item_name, 
          si.item_cost_per_person, 
          si.quantity
        FROM store_items si
        JOIN services s ON si.service_id = s.id
        ORDER BY si.service_id
      `);
  
      // Group by service
      const grouped = {};
      items.forEach(item => {
        if (!grouped[item.service_id]) {
          grouped[item.service_id] = {
            service_id: item.service_id,
            service_name: item.service_name,
            items: []
          };
        }
        grouped[item.service_id].items.push({
          id: item.id,
          name: item.item_name,
          cost: item.item_cost_per_person,
          quantity: item.quantity
        });
      });
  
      res.json({ success: true, storeItems: Object.values(grouped) });
    } catch (error) {
      console.error("❌ Error fetching store items:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });


  // Fetch all storekeepers
router.get('/profile', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT id, username, first_name, last_name, email, phone_number, created_at FROM storekeeper'
      );
      res.json(rows);
    } catch (error) {
      console.error('Error fetching storekeepers:', error);
      res.status(500).json({ error: 'Failed to fetch storekeeper data' });
    }
  });
// Fetch approved customer service payments, related store items, and total cost
router.get("/approved-customer-service-payments", async (req, res) => {
  try {
      const query = `
          SELECT 
              csp.id AS payment_id,
              CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
              s.name AS service_name,
              si.item_name AS store_item_name,
              CONCAT(d.first_name, ' ', d.last_name) AS dealer_name,
              dsi.quantity,
              csp.status AS payment_status,
              csp.total_cost,
              csp.service_booking_id  -- Added the service_booking_id here
          FROM customer_service_payment csp
          JOIN customers c ON csp.customer_id = c.id
          JOIN services s ON csp.service_id = s.id
          JOIN dealer_selected_items dsi ON csp.service_booking_id = dsi.service_booking_id
          JOIN store_items si ON dsi.store_item_id = si.id
          JOIN dealers d ON dsi.dealer_id = d.id
          WHERE csp.status = 'approved';
      `;

      const [results] = await pool.query(query);

      res.json({ success: true, data: results });
  } catch (error) {
      console.error("❌ Error fetching approved customer service payments:", error);
      res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message
      });
  }
});


// Endpoint for storekeeper to release items and subtract from stock
router.put("/release-items/:serviceBookingId", async (req, res) => {
  const { serviceBookingId } = req.params;

  // Get a connection from the pool
  const connection = await pool.getConnection();

  try {
      // Begin a transaction
      await connection.beginTransaction();

      // Step 1: Update the status in customer_service_payment from 'approved' to 'released'
      const updateStatusQuery = `
          UPDATE customer_service_payment 
          SET status = 'released' 
          WHERE service_booking_id = ? 
            AND status = 'approved';
      `;
      await connection.query(updateStatusQuery, [serviceBookingId]);

      // Step 2: Subtract quantity of each store item selected by the dealer from store_items
      const getSelectedItemsQuery = `
          SELECT dsi.store_item_id, dsi.quantity 
          FROM dealer_selected_items dsi
          WHERE dsi.service_booking_id = ?;
      `;
      const [selectedItems] = await connection.query(getSelectedItemsQuery, [serviceBookingId]);

      // Subtract each selected quantity from the store_items table
      for (const item of selectedItems) {
          const subtractQuantityQuery = `
              UPDATE store_items
              SET quantity = quantity - ?
              WHERE id = ?;
          `;
          await connection.query(subtractQuantityQuery, [item.quantity, item.store_item_id]);
      }

      // Commit the transaction
      await connection.commit();

      // Release the connection back to the pool
      connection.release();

      res.json({ success: true, message: 'Items released and stock updated successfully.' });
  } catch (error) {
      // If any error occurs, rollback the transaction
      await connection.rollback();
      console.error("❌ Error releasing items and updating stock:", error);

      // Release the connection back to the pool even if there is an error
      connection.release();

      res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message
      });
  }
});

module.exports = router;
