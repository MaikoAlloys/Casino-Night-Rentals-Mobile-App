const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateCustomer = require("../middleware/authenticateCustomer");

// Handle customer payment
router.post("/order-payment", async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { cartItems, totalAmount, paymentMethod, referenceCode, customerId } = req.body;

        // Validate required fields
        if (!cartItems || !totalAmount || !paymentMethod || !referenceCode || !customerId) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        // Validate reference code length
        if (paymentMethod === "mpesa" && referenceCode.length !== 10) {
            return res.status(400).json({ success: false, message: "MPesa reference code must be 10 characters." });
        }
        if (paymentMethod === "bank" && referenceCode.length !== 14) {
            return res.status(400).json({ success: false, message: "Bank reference code must be 14 characters." });
        }

        // Insert payment
        const [paymentResult] = await connection.execute(
            `INSERT INTO payments (customer_id, total_amount, payment_method, reference_code, status, created_at)
             VALUES (?, ?, ?, ?, 'Pending', NOW())`,
            [customerId, totalAmount, paymentMethod, referenceCode]
        );

        if (paymentResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(500).json({ success: false, message: "Failed to record payment." });
        }

        // Process each cart item
        for (let item of cartItems) {
            const { product_id, quantity } = item;

            // Verify product exists and has sufficient quantity
            const [product] = await connection.execute(
                'SELECT * FROM products WHERE id = ? FOR UPDATE',
                [product_id]
            );
            
            if (product.length === 0) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: `Product with id ${product_id} does not exist.` 
                });
            }

            if (product[0].quantity < quantity) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient quantity for product ${product[0].name}.` 
                });
            }

            // Insert order item
            await connection.execute(
                `INSERT INTO order_items (payment_id, product_id, quantity)
                 VALUES (?, ?, ?)`,
                [paymentResult.insertId, product_id, quantity]
            );

            // Reduce product quantity
            await connection.execute(
                'UPDATE products SET quantity = quantity - ? WHERE id = ?',
                [quantity, product_id]
            );

            // Remove from cart
            await connection.execute(
                'DELETE FROM product_cart WHERE customer_id = ? AND product_id = ?',
                [customerId, product_id]
            );
        }

        await connection.commit();
        return res.json({ 
            success: true, 
            message: "Payment recorded successfully. Cart cleared and quantities updated." 
        });

    } catch (error) {
        await connection.rollback();
        console.error("Payment processing error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error. Please try again." 
        });
    } finally {
        connection.release();
    }
});

// Clear cart endpoint
router.delete("/cart/clear-cart", async (req, res) => {
    try {
        const { customerId } = req.body;
        
        await pool.execute(
            'DELETE FROM product_cart WHERE customer_id = ?',
            [customerId]
        );
        
        res.json({ success: true, message: "Cart cleared successfully" });
    } catch (error) {
        // console.error("Error clearing cart:", error);
        res.status(500).json({ success: false, message: "Error clearing cart" });
    }
});


// Fetch payments of logged-in customer
router.get("/customer-payments", authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.customer.id;
        console.log("✅ Customer ID from Token:", customerId); // Debugging log

        const query = `
            SELECT 
                p.reference_code, 
                c.id AS customer_id, 
                c.first_name, 
                c.last_name, 
                pr.name AS product_name, 
                oi.quantity, 
                p.payment_method, 
                p.status, 
                p.created_at,
                p.total_amount  -- Include total_amount in the query
            FROM payments p
            JOIN customers c ON p.customer_id = c.id
            JOIN order_items oi ON p.id = oi.payment_id
            JOIN products pr ON oi.product_id = pr.id
            WHERE p.customer_id = ?
        `;

        const [payments] = await pool.query(query, [customerId]);

        if (payments.length === 0) {
            return res.status(404).json({ error: "No payments found" });
        }

        res.json({ success: true, payments });
    } catch (error) {
        console.error("❌ Error fetching payments:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


module.exports = router;