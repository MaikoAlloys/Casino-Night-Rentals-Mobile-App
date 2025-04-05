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
router.get('/bookings', authenticateCustomer, async (req, res) => {
    try {
      const customerId = req.customer.id;
  
      // Fetch service bookings from the database
      const [bookings] = await pool.query(`
        SELECT 
          sb.id AS booking_id,
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
  
  
module.exports = router;
