const express = require('express');
const router = express.Router();
const pool = require('../db'); // adjust path if needed
const authenticateCustomer = require('../middleware/authenticateCustomer');

// Route to create a service booking
router.post('/book', authenticateCustomer, async (req, res) => {
    try {
      const customerId = req.customer.id;
      const { serviceId, eventDate, numberOfPeople, paymentMethod, referenceCode, bookingFee } = req.body;
  
      if (!serviceId || !eventDate || !numberOfPeople || !paymentMethod || !referenceCode || !bookingFee) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      // Insert booking into the database
      const [result] = await pool.query(
        `INSERT INTO service_booking 
        (customer_id, service_id, event_date, number_of_people, booking_fee, payment_method, reference_code)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [customerId, serviceId, eventDate, numberOfPeople, bookingFee, paymentMethod, referenceCode]
      );
  
      res.status(201).json({ message: 'Booking successful', bookingId: result.insertId });
    } catch (err) {
      console.error('❌ Error creating service booking:', err);
      res.status(500).json({ message: 'Server error', error: err });
    }
  });


// Get service bookings for the logged-in customer
// Get service bookings for the logged-in customer
router.get('/bookings', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;

    // Fetch service bookings from the database
    const [bookings] = await pool.query(`
      SELECT 
        sb.id AS service_booking_id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
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
      WHERE sb.customer_id = ?
      ORDER BY sb.created_at DESC
    `, [customerId]);

    // If no bookings are found, return a "No records found" message
    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this customer' });
    }

    // Return the bookings in the response
    res.status(200).json(bookings);
    
  } catch (err) {
    console.error("❌ Error fetching service bookings:", err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});

  //Fetching quotation to customer
// Fetching selected items for customer with service_booking_id
router.get('/selected-items', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id; // Get customer ID from the middleware
    const query = `
      SELECT 
        c.first_name AS customer_name,
        s.name AS service_name,
        si.item_name,
        di.quantity,
        si.item_cost_per_person AS item_cost,
        (di.quantity * si.item_cost_per_person) AS total_cost,
        da.service_booking_id
      FROM dealer_selected_items di
      JOIN store_items si ON di.store_item_id = si.id
      JOIN services s ON di.service_id = s.id
      JOIN dealer_assignments da ON di.service_booking_id = da.service_booking_id
      JOIN customers c ON di.customer_id = c.id
      WHERE di.customer_id = ? AND di.status = 'pending'
    `;

    const [selectedItems] = await pool.query(query, [customerId]);

    if (selectedItems.length === 0) {
      return res.status(200).json({ message: 'No items selected by customer' });
    }

    // Calculate total cost for all items selected
    const totalCost = selectedItems.reduce((acc, item) => acc + parseFloat(item.total_cost), 0).toFixed(2);  // Ensure it's treated as a float

    res.status(200).json({ selectedItems, totalCost });
  } catch (err) {
    console.error("❌ Error fetching selected items:", err);
    res.status(500).json({ message: 'Error fetching selected items', error: err });
  }
});

  

  // Quotations-Process payment for the selected items with service_booking_id
router.post('/process-payment', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { serviceBookingId, totalCost, paymentMethod, referenceCode } = req.body;

    // Ensure the serviceBookingId is part of the payment query
    const query = `
      INSERT INTO customer_service_payment (total_cost, customer_id, service_id, service_booking_id, payment_method, reference_code, status)
      SELECT ?, ?, s.id, ?, ?, ?, 'pending'
      FROM dealer_assignments da
      JOIN services s ON da.service_id = s.id
      WHERE da.service_booking_id = ?
    `;

    // Execute the payment query
    const [result] = await pool.query(query, [
      totalCost,
      customerId,
      serviceBookingId,
      paymentMethod,
      referenceCode,
      serviceBookingId
    ]);

    // After inserting the payment, update the status of selected items to 'paid'
    const updateQuery = `
      UPDATE dealer_selected_items
      SET status = 'paid'
      WHERE service_booking_id = ?
    `;
    await pool.query(updateQuery, [serviceBookingId]);

    res.status(201).json({ message: 'Payment processed successfully', paymentId: result.insertId });
  } catch (err) {
    console.error("❌ Error processing payment:", err);
    res.status(500).json({ message: 'Error processing payment', error: err });
  }
});

  
module.exports = router;
