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
  
module.exports = router;
