
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


// Endpoint for finance to fetch items to pay supplier
// Endpoint for finance to fetch items to pay supplier
// router.get('/fetch-items-to-pay', async (req, res) => {
//     try {
//       // Fetch item details where the status is "received"
//       const [itemDetails] = await pool.query(`
//         SELECT
//           ssi.id AS storekeeper_selected_item_id,
//           ssi.quantity,
//           ssi.total_cost,
//           ROUND(ssi.total_cost * ssi.quantity, 2) AS grand_total,
//           sup.id AS supplier_id,
//           CONCAT(sup.first_name, ' ', sup.last_name) AS supplier_full_name,
//           COALESCE(p.name, si.item_name) AS item_name
//         FROM storekeeper_selected_items ssi
//         JOIN suppliers sup ON ssi.supplier_id = sup.id
//         LEFT JOIN products p ON ssi.item_type = 'product' AND ssi.item_id = p.id
//         LEFT JOIN store_items si ON ssi.item_type = 'service' AND ssi.item_id = si.id
//         WHERE ssi.status = 'received'
//       `);
  
//       if (!itemDetails.length) {
//         return res.status(404).json({ success: false, message: 'No items found with received status' });
//       }
  
//       // Ensure grand_total is returned as a proper number
//       itemDetails.forEach(item => {
//         item.grand_total = parseFloat(item.grand_total); // Ensure grand_total is a float number
//       });
  
//       // Return the fetched items as a response
//       return res.status(200).json({
//         success: true,
//         data: itemDetails
//       });
  
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   });
  

router.get('/fetch-items-to-pay', async (req, res) => {
  try {
    // Fetch item details where the status is "received"
    const [itemDetails] = await pool.query(`
      SELECT
        ssi.id AS storekeeper_selected_item_id,
        ssi.quantity,
        CASE
          WHEN ssi.item_type = 'product' THEN ROUND(ssi.total_cost / ssi.quantity, 2)
          ELSE ssi.total_cost
        END AS total_cost,
        ROUND(
          CASE
            WHEN ssi.item_type = 'product' THEN ssi.total_cost
            ELSE ssi.total_cost * ssi.quantity
          END, 2
        ) AS grand_total,
        sup.id AS supplier_id,
        CONCAT(sup.first_name, ' ', sup.last_name) AS supplier_full_name,
        COALESCE(p.name, si.item_name) AS item_name
      FROM storekeeper_selected_items ssi
      JOIN suppliers sup ON ssi.supplier_id = sup.id
      LEFT JOIN products p ON ssi.item_type = 'product' AND ssi.item_id = p.id
      LEFT JOIN store_items si ON ssi.item_type = 'service' AND ssi.item_id = si.id
      WHERE ssi.status = 'received'
    `);

    if (!itemDetails.length) {
      return res.status(404).json({ success: false, message: 'No items found with received status' });
    }

    // Ensure grand_total is returned as a proper number
    itemDetails.forEach(item => {
      item.grand_total = parseFloat(item.grand_total); // Ensure grand_total is a float number
    });

    // Return the fetched items as a response
    return res.status(200).json({
      success: true,
      data: itemDetails
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

  //paying supplier
  // Endpoint for finance to make a payment to supplier
router.post('/pay-supplier', async (req, res) => {
    const { payment_method, reference_code, paid_amount, storekeeper_selected_item_id } = req.body;
  
    // Validate input fields
    if (!payment_method || !reference_code || !paid_amount || !storekeeper_selected_item_id) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
  
    // Validate the reference code based on payment method
    const referenceCodeRegex = payment_method === 'mpesa' ? /^[A-Za-z0-9]{10}$/ : /^[A-Za-z0-9]{14}$/;
    if (!referenceCodeRegex.test(reference_code)) {
      return res.status(400).json({ success: false, message: `Invalid reference code for ${payment_method}` });
    }
  
    try {
      // Start a transaction to ensure both the payment insertion and the status update are done atomically
      await pool.query('START TRANSACTION');
  
      // Insert the payment data into the supplier_payments table
      const [result] = await pool.query(`
        INSERT INTO supplier_payments (
          payment_method,
          status,
          reference_code,
          supplier_id,
          storekeeper_selected_item_id,
          paid_amount
        ) 
        SELECT
          ? AS payment_method,
          'pending' AS status,
          ? AS reference_code,
          ssi.supplier_id,
          ? AS storekeeper_selected_item_id,
          ? AS paid_amount
        FROM storekeeper_selected_items ssi
        WHERE ssi.id = ?
      `, [payment_method, reference_code, storekeeper_selected_item_id, paid_amount, storekeeper_selected_item_id]);
  
      // If no rows are affected, something went wrong
      if (result.affectedRows === 0) {
        await pool.query('ROLLBACK'); // Rollback transaction if no rows affected
        return res.status(404).json({ success: false, message: 'Storekeeper item not found' });
      }
  
      // Update the status in storekeeper_selected_items to 'paid' from 'received'
      const [updateResult] = await pool.query(`
        UPDATE storekeeper_selected_items
        SET status = 'paid'
        WHERE id = ? AND status = 'received'
      `, [storekeeper_selected_item_id]);
  
      // If no rows are updated, something went wrong
      if (updateResult.affectedRows === 0) {
        await pool.query('ROLLBACK'); // Rollback transaction if update fails
        return res.status(400).json({ success: false, message: 'Failed to update status to paid' });
      }
  
      // Commit the transaction
      await pool.query('COMMIT');
  
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Payment recorded and status updated to paid successfully'
      });
  
    } catch (error) {
      console.error(error);
      await pool.query('ROLLBACK'); // Rollback transaction in case of any error
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  //fetching feedback  for finance
  router.get("/finance-feedback", async (req, res) => {
    console.log(`[${new Date().toISOString()}] Fetching feedback for finance`);
  
    try {
      // Step 1: Fetch feedback sent to finance (with customer name)
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
         WHERE f.finance_id IS NOT NULL
         ORDER BY f.created_at DESC`
      );
  
      if (feedbackResults.length === 0) {
        return res.json({
          success: true,
          message: 'No feedback found for finance',
          feedback: []
        });
      }
  
      res.json({
        success: true,
        feedback: feedbackResults
      });
  
    } catch (error) {
      console.error(`Error fetching finance feedback:`, error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });

  
  // POST /finance/feedback/reply
router.post("/reply", async (req, res) => {
    const { feedbackId, reply } = req.body;
  
    console.log(`[${new Date().toISOString()}] Finance replying to feedback ${feedbackId}`);
  
    if (!feedbackId || !reply) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: feedbackId or reply"
      });
    }
  
    try {
      // Step 1: Check if feedback exists and is assigned to finance
      const [feedbackCheck] = await pool.query(
        `SELECT * FROM feedback 
         WHERE feedback_id = ? AND finance_id IS NOT NULL`,
        [feedbackId]
      );
  
      if (feedbackCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found or not assigned to finance"
        });
      }
  
      // Step 2: Update the feedback with the reply
      await pool.query(
        `UPDATE feedback 
         SET reply = ?, 
             reply_by = 'Finance',
             reply_time = NOW(), 
             status = 'resolved'
         WHERE feedback_id = ? AND finance_id IS NOT NULL`,
        [reply, feedbackId]
      );
  
      // Step 3: Fetch updated feedback
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
      console.error(`Error replying to finance feedback ${feedbackId}:`, error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
    }
  });
  
  
module.exports = router;
