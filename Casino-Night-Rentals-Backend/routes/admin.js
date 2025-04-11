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


// GET request to fetch products details
router.get("/products", async (req, res) => {
    // SQL query to fetch product details
    const query = `
        SELECT id, name, quantity, rental_price, image_url, total_cost 
        FROM products;
    `;

    try {
        const [results] = await pool.query(query);  // Use `await` for the promise-based query

        // If no products are found, return an empty array
        if (results.length === 0) {
            return res.status(404).json({ message: "No products found" });
        }

        // Return the product data
        return res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database error", error: err });
    }
});


// GET /admin/services - fetch all services
// GET /admin/services
router.get("/services", async (req, res) => {
    try {
      const [services] = await pool.query(`
        SELECT id, name, service_fee, booking_fee 
        FROM services
      `);
  
      res.status(200).json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });

  router.get("/all-users", async (req, res) => {
    try {
      const roles = [
        { table: "dealers", role: "dealer" },
        { table: "event_manager", role: "event_manager" },
        { table: "finance", role: "finance" },
        { table: "storekeeper", role: "storekeeper" },
        { table: "suppliers", role: "supplier" },
        { table: "service_manager", role: "service_manager" },
      ];
  
      const results = {};
  
      for (const { table, role } of roles) {
        const [rows] = await pool.query(
          `SELECT id, username, first_name, last_name, email, phone_number, created_at FROM ${table}`
        );
        results[role] = rows.map(user => ({
          ...user,
          role,
        }));
      }
  
      res.json(results);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });



  //fetching feedback
  router.get("/feedback", async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          f.feedback_id,
          f.message,
          f.rating,
          f.status,
          f.created_at,
          f.reply,
          f.reply_by,
          f.reply_time,
  
          -- Combine first and last name into full name
          CONCAT_WS(' ',
            COALESCE(c.first_name, d.first_name, s.first_name, f2.first_name, e.first_name),
            COALESCE(c.last_name, d.last_name, s.last_name, f2.last_name, e.last_name)
          ) AS sender_name,
  
          COALESCE(c.username, d.username, s.username, f2.username, e.username) AS sender_username,
  
          CASE
            WHEN f.customer_id IS NOT NULL THEN 'customer'
            WHEN f.dealer_id IS NOT NULL THEN 'dealer'
            WHEN f.service_manager_id IS NOT NULL THEN 'service_manager'
            WHEN f.finance_id IS NOT NULL THEN 'finance'
            WHEN f.event_manager_id IS NOT NULL THEN 'event_manager'
            ELSE 'unknown'
          END AS sender_role
  
        FROM feedback f
        LEFT JOIN customers c ON f.customer_id = c.id
        LEFT JOIN dealers d ON f.dealer_id = d.id
        LEFT JOIN service_manager s ON f.service_manager_id = s.id
        LEFT JOIN finance f2 ON f.finance_id = f2.id
        LEFT JOIN event_manager e ON f.event_manager_id = e.id
        ORDER BY f.created_at DESC
      `);
  
      res.json(rows);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });
  //fetch product payment details
  
  router.get("/payment-details", async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          c.first_name,
          c.last_name,
          p.reference_code,
          p.payment_method,
          p.total_amount,
          p.status,
          p.created_at,
          pr.name AS product_name,
          oi.quantity
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        JOIN order_items oi ON oi.payment_id = p.id
        JOIN products pr ON pr.id = oi.product_id
        ORDER BY p.created_at
      `);
  
      res.json(rows);
    } catch (err) {
      console.error("Error fetching payment details:", err);
      res.status(500).json({ error: "Failed to fetch payment details" });
    }
  });
  
  //service booking details
  router.get("/service-booking-details", async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          c.first_name AS customer_first_name,
          c.last_name AS customer_last_name,
          s.name AS service_name,
          sb.event_date,
          sb.number_of_people,
          sb.booking_fee,
          sb.payment_method,
          sb.reference_code,
          sb.status,
          sb.created_at
        FROM service_booking sb
        JOIN customers c ON sb.customer_id = c.id
        JOIN services s ON sb.service_id = s.id
        ORDER BY sb.created_at;
      `);
  
      res.json(rows);
    } catch (err) {
      console.error("Error fetching service booking details:", err);
      res.status(500).json({ error: "Failed to fetch service booking details" });
    }
  });
  
  //fetching payments of service
  router.get("/customer-service-payments", async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          CONCAT(c.first_name, ' ', c.last_name) AS customer_full_name,
          s.name AS service_name,
          cp.total_cost,
          cp.payment_method,
          cp.reference_code,
          cp.status,
          cp.created_at
        FROM customer_service_payment cp
        JOIN customers c ON cp.customer_id = c.id
        JOIN services s ON cp.service_id = s.id
        ORDER BY cp.created_at;
      `);
  
      res.json(rows);
    } catch (err) {
      console.error("Error fetching customer service payments:", err);
      res.status(500).json({ error: "Failed to fetch customer service payments" });
    }
  });
  
//storekeeper payments
  // Endpoint to fetch storekeeper selected items and supplier payment information
  router.get("/storekeeper-supplier-payments", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                ss.id AS storekeeper_selected_item_id,
                ss.item_type,
                ss.quantity,
                ss.total_cost,
                ss.status AS storekeeper_status,
                sp.payment_method,
                sp.reference_code,
                sp.status AS payment_status,
                sp.paid_amount,
                sp.payment_date,
                CONCAT(sup.first_name, ' ', sup.last_name) AS supplier_full_name,  -- Added supplier full name
                CASE 
                    WHEN ss.item_type = 'service' THEN si.item_name
                    WHEN ss.item_type = 'product' THEN p.name
                END AS item_name
            FROM storekeeper_selected_items ss
            JOIN supplier_payments sp ON ss.id = sp.storekeeper_selected_item_id
            JOIN suppliers sup ON ss.supplier_id = sup.id  -- Join to get supplier info
            LEFT JOIN store_items si ON ss.item_id = si.id AND ss.item_type = 'service'
            LEFT JOIN products p ON ss.item_id = p.id AND ss.item_type = 'product'
            ORDER BY sp.payment_date DESC;
        `);

        res.json(rows);  // Sending the result as JSON response
    } catch (err) {
        console.error("Error fetching storekeeper and supplier payment data:", err);
        res.status(500).json({ error: "Failed to fetch storekeeper and supplier payment data" });
    }
});


module.exports = router;