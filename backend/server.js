require('dotenv').config();
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Add this line to merge your frontend and backend!
// Serve static files and automatically hide the .html extensions!
app.use(express.static('public', { extensions: ['html'] }));

// ... (The rest of your database and API route code stays exactly the same)

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your_local_password',
    database: process.env.DB_NAME || 'mycart',
    port: process.env.DB_PORT || 25034,
    ssl: {
        rejectUnauthorized: false // This line right here is the magic fix!
    }
});

// Test the connection
pool.getConnection()
    .then(() => console.log('✅ Successfully connected to MySQL Database!'))
    .catch((err) => console.error('❌ Database connection failed:', err));


// 2. THIS IS YOUR ROUTE (Where the frontend asks for products)
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Products');
        res.json({
            message: "Success",
            products: rows
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: "Server Error" });
    }
});
// Fetch all products from the database
app.get('/api/products', async (req, res) => {
    try {
        // Ask the database for all rows in the Products table
        const [rows] = await pool.query('SELECT * FROM Products');
        res.json({
            message: "Success",
            products: rows
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: "Server Error" });
    }
});
// Add this near the top with your other requires:
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: 'rzp_test_YOUR_12345abcde',
    key_secret: 'abc123def456'
});

// Add this route above app.listen:
// This creates a digital "bill" before the user actually pays
app.post('/api/create-payment', async (req, res) => {
    try {
        const options = {
            amount: 50000, // Amount in paisa (50000 paisa = ₹500)
            currency: "INR",
            receipt: "receipt_order_1"
        };

        const order = await razorpay.orders.create(options);
        res.json({ message: "Success", order: order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
});
// Admin Route: Get all orders
app.get('/api/admin/orders', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Orders ORDER BY order_id DESC');
        res.json({ message: "Success", orders: rows });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Admin Route: Update order to 'Shipped'
app.post('/api/admin/orders/:id/ship', async (req, res) => {
    try {
        const orderId = req.params.id;
        await pool.query('UPDATE Orders SET status = "shipped" WHERE order_id = ?', [orderId]);
        res.json({ message: "Order updated successfully" });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.get('/setup-admin', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const email = 'admin@mycart.com';

        // Notice we are using the 'admin' table here!
        const query = "INSERT INTO admin (email, password) VALUES (?, ?)";
        
        pool.query(query, [email, hashedPassword], (err, result) => {
            if (err) return res.status(500).send("Database error: " + err.message);
            res.send("✅ Admin user successfully created! You can now log in.");
        });
    } catch (error) {
        res.status(500).send("Server error: " + error.message);
    }
});
app.get('/reset-admin', async (req, res) => {
    try {
        // We will force the password to be exactly this:
        const hashedPassword = await bcrypt.hash('password123', 10);
        const email = 'admin@mycart.com';

        // This query specifically UPDATES the existing password
        const query = "UPDATE admin SET password = ? WHERE email = ?";
        
        pool.query(query, [hashedPassword, email], (err, result) => {
            if (err) return res.status(500).send("Database error: " + err.message);
            
            if (result.affectedRows === 0) {
                 return res.send("❌ Error: No admin found with that email. Run /setup-admin first.");
            }
            
            res.send("✅ Admin password successfully RESET! You can now log in with: password123");
        });
    } catch (error) {
        res.status(500).send("Server error: " + error.message);
    }
});
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    pool.query("SELECT * FROM admin WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // +++ ADD THESE 3 LINES RIGHT HERE +++
        if (result.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        // ++++++++++++++++++++++++++++++++++++

        const user = result[0];
        // Now this won't crash because we know 'user' actually exists!
        const isMatch = await bcrypt.compare(password, user.password); 
        
        // ... the rest of your login code ...
    });
});
// --- NEW USER REGISTRATION ---
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10); // Encrypt password

        await pool.query('INSERT INTO Users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        res.json({ message: "Registration successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Email already exists or server error" });
    }
});

// --- USER LOGIN ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);

        if (users.length === 0) return res.status(401).json({ message: "User not found" });

        const isValid = await bcrypt.compare(password, users[0].password_hash);
        if (!isValid) return res.status(401).json({ message: "Invalid password" });

        res.json({
            message: "Success",
            user: { id: users[0].user_id, name: users[0].name, role: users[0].role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// --- GET SINGLE PRODUCT DETAILS ---
// Fetch a single product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const [rows] = await pool.query('SELECT * FROM Products WHERE product_id = ?', [productId]);

        if (rows.length > 0) {
            res.json({ message: "Success", product: rows[0] });
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error("Database fetch error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


// 3. THIS IS THE APP.LISTEN BLOCK (Always at the very bottom)
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 MyCart Server is running on http://localhost:${PORT}`);
});