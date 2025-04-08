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
    const [supplier] = await pool.query("SELECT * FROM suppliers WHERE username = ?", [username]);

    if (supplier.length === 0) {
      return res.status(401).json({ message: "Supplier not found" });
    }

    const validPassword = await bcrypt.compare(password, supplier[0].password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const { password: _, ...supplierInfo } = supplier[0];
    res.status(200).json({ message: "Login successful", supplier: supplierInfo });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /supplier/items
router.get('/items/:supplierId', async (req, res) => {
    const { supplierId } = req.params; // Get the supplierId from the request params
  
    console.log(`[${new Date().toISOString()}] Fetching items for supplier: ${supplierId}`);
  
    try {
      // Check if the supplier exists
      const [supplierCheck] = await pool.query(
        'SELECT id FROM suppliers WHERE id = ?',
        [supplierId]
      );
  
      if (supplierCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }
  
      // Fetch all pending items for this supplier from storekeeper_selected_items table and join with products or store_items
      const [items] = await pool.query(
        `SELECT 
          si.id AS item_id,
          si.item_type,
          si.supplier_id,
          si.quantity,
          si.total_cost,
          si.created_at,
          (si.quantity * si.total_cost) AS item_total_cost,
          CASE 
            WHEN si.item_type = 'product' THEN p.name
            WHEN si.item_type = 'service' THEN si_service.item_name
            ELSE NULL
          END AS item_name
        FROM storekeeper_selected_items si
        LEFT JOIN products p ON si.item_type = 'product' AND p.id = si.item_id
        LEFT JOIN store_items si_service ON si.item_type = 'service' AND si_service.id = si.item_id
        WHERE si.supplier_id = ? AND si.status = 'pending'`,
        [supplierId]
      );
  
      if (items.length === 0) {
        return res.json({
          success: true,
          message: 'No pending items found for this supplier',
          items: []
        });
      }
  
      // Calculate the total cost for all items (as a float)
      const grandTotal = items.reduce((sum, item) => sum + parseFloat(item.item_total_cost), 0);
  
      res.json({
        success: true,
        items,
        grandTotal
      });
  
    } catch (error) {
      console.error(`Error fetching items for supplier ${supplierId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });
  
// POST /supplier/items/approve
router.post('/items/approve', async (req, res) => {
  const { supplierId, itemIds } = req.body; // itemIds is an array of item IDs to be approved

  console.log(`[${new Date().toISOString()}] Approving items for supplier: ${supplierId}`);

  try {
    // Check if the supplier exists
    const [supplierCheck] = await pool.query(
      'SELECT id FROM suppliers WHERE id = ?',
      [supplierId]
    );

    if (supplierCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Update the status of the selected items to 'approved'
    const [updateResult] = await pool.query(
      `UPDATE storekeeper_selected_items 
      SET status = 'approved'
      WHERE supplier_id = ? AND id IN (?) AND status = 'pending'`,
      [supplierId, itemIds]
    );

    if (updateResult.affectedRows === 0) {
      return res.json({
        success: true,
        message: 'No items were updated (either already approved or not found)'
      });
    }

    res.json({
      success: true,
      message: 'Items successfully approved'
    });

  } catch (error) {
    console.error(`Error approving items for supplier ${supplierId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

//fetch paid items
router.get('/paid-items/:supplierId', async (req, res) => {
    const { supplierId } = req.params; // Get the supplierId from the request params
  
    console.log(`[${new Date().toISOString()}] Fetching paid items for supplier: ${supplierId}`);
  
    try {
      // Check if the supplier exists
      const [supplierCheck] = await pool.query(
        'SELECT id FROM suppliers WHERE id = ?',
        [supplierId]
      );
  
      if (supplierCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }
  
      // Fetch all paid items for this supplier from storekeeper_selected_items and supplier_payments tables
      const [items] = await pool.query(
        `SELECT 
          ssi.id AS storekeeper_selected_item_id,
          ssi.quantity,
          ssi.total_cost,
          ROUND(ssi.total_cost * ssi.quantity, 2) AS grand_total,
          sup.id AS supplier_id,
          CONCAT(sup.first_name, ' ', sup.last_name) AS supplier_full_name,
          COALESCE(p.name, si.item_name) AS item_name,
          sp.paid_amount,
          sp.reference_code,
          sp.payment_date,
          sp.status AS payment_status  -- Add status here
        FROM storekeeper_selected_items ssi
        JOIN suppliers sup ON ssi.supplier_id = sup.id
        LEFT JOIN products p ON ssi.item_type = 'product' AND ssi.item_id = p.id
        LEFT JOIN store_items si ON ssi.item_type = 'service' AND ssi.item_id = si.id
        LEFT JOIN supplier_payments sp ON ssi.id = sp.storekeeper_selected_item_id
        WHERE ssi.supplier_id = ? AND ssi.status = 'paid'`,
        [supplierId]
      );
  
      if (items.length === 0) {
        return res.json({
          success: true,
          message: 'No paid items found for this supplier',
          items: []
        });
      }
  
      // Calculate the total amount paid for all items (as a float)
      const totalPaidAmount = items.reduce((sum, item) => sum + parseFloat(item.paid_amount), 0);
  
      res.json({
        success: true,
        items,
        totalPaidAmount
      });
  
    } catch (error) {
      console.error(`Error fetching paid items for supplier ${supplierId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
});

  //supplier to approve payment
  router.put('/approve-payment/:supplierId', async (req, res) => {
    const { supplierId } = req.params; // Get the supplierId from the request params
    const { storekeeper_selected_item_id } = req.body; // Get the selected item ID from request body
  
    console.log(`[${new Date().toISOString()}] Updating payment status to 'approved' for supplier: ${supplierId}`);
  
    try {
      // Check if the supplier exists
      const [supplierCheck] = await pool.query(
        'SELECT id FROM suppliers WHERE id = ?',
        [supplierId]
      );
  
      if (supplierCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }
  
      // Check if the payment entry exists for this supplier and the provided selected item
      const [paymentCheck] = await pool.query(
        `SELECT id, status FROM supplier_payments 
         WHERE supplier_id = ? AND storekeeper_selected_item_id = ? AND status = 'pending'`,
        [supplierId, storekeeper_selected_item_id]
      );
  
      if (paymentCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No pending payment found for this supplier and item'
        });
      }
  
      // Update the payment status to 'approved'
      const [updateResult] = await pool.query(
        `UPDATE supplier_payments 
         SET status = 'approved'
         WHERE supplier_id = ? AND storekeeper_selected_item_id = ? AND status = 'pending'`,
        [supplierId, storekeeper_selected_item_id]
      );
  
      // Check if any rows were updated
      if (updateResult.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update payment status'
        });
      }
  
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Payment status updated to approved'
      });
  
    } catch (error) {
      console.error(`Error updating payment status for supplier ${supplierId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });
  
module.exports = router;
