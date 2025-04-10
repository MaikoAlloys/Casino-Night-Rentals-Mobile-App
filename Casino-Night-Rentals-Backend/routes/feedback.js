const express = require("express");
const router = express.Router();
const pool = require("../db"); // Assuming db.js exports your MySQL pool
const authenticateCustomer = require("../middleware/authenticateCustomer");
const jwt = require("jsonwebtoken");

// Endpoint to get full names of all users (fetching data from all tables individually)
router.get("/users", authenticateCustomer, async (req, res) => {
  try {
    // Fetch customers
    // const customersQuery = "SELECT CONCAT(first_name, ' ', last_name) AS customer_name FROM customers";
    // const [customers] = await pool.query(customersQuery);

    // Fetch dealers
    const dealersQuery = "SELECT CONCAT(first_name, ' ', last_name) AS dealer_name FROM dealers";
    const [dealers] = await pool.query(dealersQuery);

    // Fetch service managers
    const serviceManagersQuery = "SELECT CONCAT(first_name, ' ', last_name) AS service_manager_name FROM service_manager";
    const [serviceManagers] = await pool.query(serviceManagersQuery);

    // Fetch finance
    const financeQuery = "SELECT CONCAT(first_name, ' ', last_name) AS finance_name FROM finance";
    const [finance] = await pool.query(financeQuery);

    // Fetch event managers
    const eventManagersQuery = "SELECT CONCAT(first_name, ' ', last_name) AS event_manager_name FROM event_manager";
    const [eventManagers] = await pool.query(eventManagersQuery);

    // Combine all results into a single array
    const allUsers = [
    //   ...customers.map(user => ({ customer_name: user.customer_name })),
      ...dealers.map(user => ({ dealer_name: user.dealer_name })),
      ...serviceManagers.map(user => ({ service_manager_name: user.service_manager_name })),
      ...finance.map(user => ({ finance_name: user.finance_name })),
      ...eventManagers.map(user => ({ event_manager_name: user.event_manager_name }))
    ];

    res.json({ users: allUsers });
  } catch (err) {
    console.error("Error fetching user names:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//sending feedback customer section
router.post("/submit-feedback", async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        // Verify the token and get the customer ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const customerId = decoded.id;
        
        console.log("Request body:", req.body);
        console.log("Authenticated user ID:", customerId); // Debug

        const { userName, message, rating } = req.body;

        // Validate input
        if (!userName || !message || !rating) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if rating is a valid number (1-5)
        if (isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        // Check if the user exists in any table
        const userTables = [
            { table: "dealers", column: "dealer_id" },
            { table: "service_manager", column: "service_manager_id" },
            { table: "finance", column: "finance_id" },
            { table: "event_manager", column: "event_manager_id" },
        ];

        let userId = null;
        let tableColumn = null;

        for (const { table, column } of userTables) {
            const [user] = await pool.query(
                `SELECT id FROM ${table} WHERE CONCAT(first_name, ' ', last_name) = ?`,
                [userName]
            );

            if (user.length > 0) {
                userId = user[0].id;
                tableColumn = column;
                break;
            }
        }

        if (!userId) {
            return res.status(404).json({ message: "User not found" });
        }

        // Insert feedback
        const query = `
            INSERT INTO feedback (customer_id, ${tableColumn}, message, rating, status)
            VALUES (?, ?, ?, ?, 'pending')
        `;

        const [result] = await pool.query(query, [customerId, userId, message, rating]);

        res.status(201).json({
            message: "Feedback submitted successfully",
            feedbackId: result.insertId,
            userName,
        });

    } catch (err) {
        console.error("❌ Error submitting feedback:", err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(500).json({ message: "Server error" });
    }
});


/// Helper function to verify staff exists in any table
async function verifyStaffExists(staffId) {
    const staffTables = [
        'dealers',
        'service_manager',
        'finance',
        'event_manager',
        'admins'
    ];

    for (const table of staffTables) {
        const [result] = await pool.query(
            `SELECT 1 FROM ${table} WHERE id = ?`,
            [staffId]
        );
        if (result.length > 0) return true;
    }
    return false;
}

// Updated authorization check to handle both token and ID auth
async function checkStaffAuthorization(staffId, feedback) {
    // Check all possible staff columns in the feedback
    const staffColumns = [
        'dealer_id',
        'service_manager_id',
        'finance_id',
        'event_manager_id'
    ];

    // Check if staffId matches any of the recipient IDs in the feedback
    for (const column of staffColumns) {
        if (feedback[column] === staffId) {
            return true;
        }
    }

    // Check if the user is an admin
    const [adminCheck] = await pool.query(
        'SELECT 1 FROM admins WHERE id = ?',
        [staffId]
    );

    return adminCheck.length > 0;
}

// Your route handler continues here...
router.post("/reply-to-feedback", async (req, res) => {
    try {
        const { feedbackId, replyMessage, staffId, staffName } = req.body;

        // Validate input
        if (!feedbackId || !replyMessage) {
            return res.status(400).json({ message: "Missing required fields: feedbackId and replyMessage" });
        }

        // Check if the feedback exists
        const [feedback] = await pool.query(
            'SELECT * FROM feedback WHERE feedback_id = ?',
            [feedbackId]
        );

        if (feedback.length === 0) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        let authorizedStaffId = null;
        let authorizedStaffName = "Staff";

        // Try token authentication first
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                authorizedStaffId = decoded.id;
                authorizedStaffName = decoded.username || "Staff";
                
                // Verify this staff member is authorized to reply
                const isAuthorized = await checkStaffAuthorization(authorizedStaffId, feedback[0]);
                if (!isAuthorized) {
                    return res.status(403).json({ message: "Not authorized to reply to this feedback" });
                }
            } catch (err) {
                console.error("Token verification error:", err);
                // Continue to try ID-based authentication if token fails
            }
        }

        // If no token or token failed, check for staffId in request body
        if (!authorizedStaffId && staffId) {
            authorizedStaffId = staffId;
            authorizedStaffName = staffName || "Staff";
            
            // Verify this staff member exists in one of the tables
            const staffExists = await verifyStaffExists(staffId);
            if (!staffExists) {
                return res.status(403).json({ message: "Invalid staff ID" });
            }
        }

        if (!authorizedStaffId) {
            return res.status(401).json({ message: "Authorization required (token or valid staffId)" });
        }

        // Update the feedback with the reply
        const updateQuery = `
            UPDATE feedback 
            SET reply = ?, 
                reply_by = ?, 
                reply_time = NOW(), 
                status = 'resolved' 
            WHERE feedback_id = ?  
        `;

        await pool.query(updateQuery, [replyMessage, authorizedStaffName, feedbackId]);

        res.status(200).json({
            message: "Reply submitted successfully",
            feedbackId: feedbackId,
            repliedBy: authorizedStaffName
        });

    } catch (err) {
        console.error("❌ Error replying to feedback:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
