const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db"); // Make sure pool is properly configured
const router = express.Router();
require("dotenv").config();
const authenticateCustomer = require("../middleware/authenticateCustomer");

// Customer Registration
router.post("/register", async (req, res) => {
  const { username, first_name, last_name, phone_number, email, password } = req.body;

  // Validate phone number (10 digits) and email format
  const phoneRegex = /^[0-9]{10}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!phoneRegex.test(phone_number)) return res.status(400).json({ error: "Phone number must be exactly 10 digits." });
  if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email format." });

  try {
    // Check if user already exists
    const [existingUser] = await pool.query("SELECT * FROM customers WHERE username = ? OR email = ? OR phone_number = ?", [username, email, phone_number]);
    if (existingUser.length > 0) return res.status(400).json({ error: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new customer with is_approved set to 0 (pending approval)
    await pool.query(
      "INSERT INTO customers (username, first_name, last_name, phone_number, email, password, is_approved) VALUES (?, ?, ?, ?, ?, ?, 0)",
      [username, first_name, last_name, phone_number, email, hashedPassword]
    );

    res.status(201).json({ message: "Registration successful. Await admin approval before login." });
  } catch (err) {
    console.error("❌ Error during registration:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Customer Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM customers WHERE username = ?", [username]);
    if (rows.length === 0) return res.status(400).json({ message: "User not found" });

    const user = rows[0];

    if (!user.is_approved) {
      return res.status(403).json({ message: "Your account is not approved yet. Please wait for admin approval." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log("✅ Token Generated:", token);

    res.json({
      message: "Login successful",
      token,
      customer: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Fetch all products
router.get("/products", async (req, res) => {
  try {
    // Fetch id, name, quantity, rental_price, and image_url from the products table
    const [products] = await pool.query("SELECT id, name, quantity, rental_price, image_url FROM products");
    res.json(products);  // Return the fetched products including quantity
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// Get all services
router.get("/services", async (req, res) => {
  try {
    const [services] = await pool.query("SELECT id, name, service_fee, booking_fee FROM services");
    res.json(services);
  } catch (err) {
    console.error("❌ Error fetching services:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Fetch customer profile (Ensure this route has proper middleware)
// Fetch customer profile (Ensure this route has proper middleware)
router.get("/profile", authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    console.log("✅ Customer ID from Token:", customerId); // Debugging log

    const [customer] = await pool.query(
      "SELECT id, username, first_name, last_name, email, phone_number FROM customers WHERE id = ?",
      [customerId]
    );

    if (customer.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer[0]); // Send first row as response, including id
  } catch (error) {
    console.error("❌ Error fetching customer profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});



// Endpoint to add product to cart
// Endpoint to add product to cart
router.post('/add', async (req, res) => {
  const { customer_id, product_name, quantity, rental_price, image_url } = req.body;

  try {
      // Check if the product already exists in the products table
      const [productResults] = await pool.query('SELECT id FROM products WHERE name = ?', [product_name]);

      if (productResults.length === 0) {
          return res.status(400).json({ message: 'Product does not exist' });
      }

      const product_id = productResults[0].id; // Get the product_id from the products table

      // Check if the product is already in the cart
      const [cartResults] = await pool.query('SELECT * FROM product_cart WHERE customer_id = ? AND product_id = ?', [customer_id, product_id]);

      if (cartResults.length > 0) {
          return res.status(400).json({ message: 'Item already in cart' });
      }

      // Insert the product into the cart, including the product_id
      const query = 'INSERT INTO product_cart (customer_id, product_id, product_name, quantity, rental_price, image_url) VALUES (?, ?, ?, ?, ?, ?)';
      await pool.query(query, [customer_id, product_id, product_name, quantity, rental_price, image_url]);

      res.status(201).json({ message: 'Product added to cart successfully' });
  } catch (err) {
      console.error("❌ Error adding product to cart:", err);
      res.status(500).json({ message: 'Database error', error: err });
  }
});


// // Endpoint to deduct quantity from the product table
// router.post('/deduct', async (req, res) => {
//   const { product_id } = req.body;

//   try {
//       // Check if the product exists in the products table
//       const [results] = await pool.query('SELECT quantity FROM products WHERE id = ?', [product_id]);

//       if (results.length === 0) {
//           return res.status(404).json({ message: 'Product not found' });
//       }

//       const product = results[0];
//       if (product.quantity <= 0) {
//           return res.status(400).json({ message: 'Product out of stock' });
//       }

//       // Deduct the quantity by 1
//       const newQuantity = product.quantity - 1;

//       // Update the quantity in the products table
//       const updateQuery = 'UPDATE products SET quantity = ? WHERE id = ?';
//       await pool.query(updateQuery, [newQuantity, product_id]);

//       res.status(200).json({ message: 'Product quantity updated successfully' });
//   } catch (err) {
//       console.error("❌ Error updating product quantity:", err);
//       res.status(500).json({ message: 'Database error', error: err });
//   }
// });


// Route to fetch cart items and total cost
router.get('/cart', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id; // We already have the customer ID from the authenticateCustomer middleware

    // Fetch the cart items for the customer
    const [cartItems] = await pool.query('SELECT * FROM product_cart WHERE customer_id = ?', [customerId]);

    if (cartItems.length === 0) {
      return res.status(200).json({ message: 'Cart is empty' });
    }

    // Calculate the total cost
    const totalCost = cartItems.reduce((acc, item) => acc + (item.rental_price * item.quantity), 0);

    res.status(200).json({ cartItems, totalCost });
  } catch (err) {
    console.error("❌ Error fetching cart:", err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});

// Route to update the quantity of a cart item
router.put('/cart/:productId', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { productId } = req.params;
    const { newQuantity } = req.body; // New quantity to update to

    // Fetch the product details to check available stock
    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);

    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const availableStock = product[0].stock_quantity;

    // Check if the new quantity is greater than the available stock
    if (newQuantity > availableStock) {
      return res.status(400).json({ message: `Cannot add more than ${availableStock} units to the cart` });
    }

    // Update the quantity in the cart
    await pool.query('UPDATE product_cart SET quantity = ? WHERE customer_id = ? AND product_id = ?', [newQuantity, customerId, productId]);

    // Fetch the updated cart
    const [updatedCartItems] = await pool.query('SELECT * FROM product_cart WHERE customer_id = ?', [customerId]);
    const totalCost = updatedCartItems.reduce((acc, item) => acc + (item.rental_price * item.quantity), 0);

    res.status(200).json({ cartItems: updatedCartItems, totalCost });
  } catch (err) {
    console.error("❌ Error updating cart:", err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});

// Route to remove a product from the cart
router.delete('/cart/:productId', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { productId } = req.params;

    // Fetch the cart item to get the quantity
    const [cartItem] = await pool.query('SELECT * FROM product_cart WHERE customer_id = ? AND product_id = ?', [customerId, productId]);

    if (cartItem.length === 0) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const removedQuantity = cartItem[0].quantity;

    // Remove the item from the cart
    await pool.query('DELETE FROM product_cart WHERE customer_id = ? AND product_id = ?', [customerId, productId]);

    // Revert the quantity in the products table
    await pool.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [removedQuantity, productId]);

    // Fetch the updated cart
    const [updatedCartItems] = await pool.query('SELECT * FROM product_cart WHERE customer_id = ?', [customerId]);
    const totalCost = updatedCartItems.reduce((acc, item) => acc + (item.rental_price * item.quantity), 0);

    res.status(200).json({ cartItems: updatedCartItems, totalCost });
  } catch (err) {
    console.error("❌ Error removing item from cart:", err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});



// Add this to your backend routes
router.get('/product-stock/:productId', authenticateCustomer, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const [product] = await pool.query('SELECT quantity FROM products WHERE id = ?', [productId]);
    
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json({ availableStock: product[0].quantity });
  } catch (err) {
    console.error("❌ Error fetching product stock:", err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});


// Endpoint to fetch product details by product ID (to check available stock)
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  
  try {
      const [product] = await pool.query('SELECT id, name, quantity FROM products WHERE id = ?', [productId]);
      
      if (product.length === 0) {
          return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json({ quantity: product[0].quantity });
  } catch (err) {
      console.error('❌ Error fetching product details:', err);
      res.status(500).json({ error: 'Database error' });
  }
});

// Route to fetch event product booking details for the logged-in customer
router.get('/event-product-bookings', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id; 

    const [bookings] = await pool.query(`
      SELECT 
        epb.id AS booking_id,
        c.first_name, 
        c.last_name, 
        p.name AS product_name, 
        oi.quantity, 
        epb.status
      FROM event_product_booking epb
      JOIN customers c ON epb.customer_id = c.id
      JOIN products p ON epb.product_id = p.id
      JOIN order_items oi 
        ON epb.product_id = oi.product_id 
        AND epb.payment_id = oi.payment_id
      WHERE epb.customer_id = ?
    `, [customerId]);

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this customer' });
    }

    res.status(200).json(bookings);
    
  } catch (err) {
    console.error("❌ Error fetching event product bookings:", err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});


// Route to confirm a reservation
router.put('/confirm-reservation/:id', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const bookingId = req.params.id;

    // Update the status of the reservation to 'confirmed'
    const [result] = await pool.query(`
      UPDATE event_product_booking
      SET status = 'confirmed'
      WHERE id = ? AND customer_id = ?`, 
      [bookingId, customerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found or you are not authorized to confirm this booking' });
    }

    res.status(200).json({ message: 'Reservation confirmed successfully' });
  } catch (err) {
    console.error("❌ Error confirming reservation:", err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});


module.exports = router;
