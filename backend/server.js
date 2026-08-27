const express = require('express');
const bcrypt = require('bcryptjs'); 
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// ⚠️ PASTE YOUR DATABASE CONNECTION HERE ⚠️
// (Your code that creates the 'pool' goes right here!)
// ==========================================


// ==========================================
// 1. REGISTRATION ROUTE
// ==========================================
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        pool.query("SELECT * FROM admin WHERE email = ?", [email], async (err, result) => {
            if (err) return res.status(500).json({ error: "Database error: " + err.message });
            
            if (result.length > 0) {
                return res.status(400).json({ message: "Email already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            pool.query(
                "INSERT INTO admin (email, password) VALUES (?, ?)",
                [email, hashedPassword],
                (insertErr) => {
                    if (insertErr) return res.status(500).json({ error: "Insert error: " + insertErr.message });
                    res.status(201).json({ message: "✅ User registered successfully!" });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

// ==========================================
// 2. LOGIN ROUTE
// ==========================================
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    pool.query("SELECT * FROM admin WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = result[0];
        console.log("🚀 DATABASE USER DATA:", user);

        // Safety check in case your column is named differently!
        const dbPassword = user.password || user.pass || user.admin_password;

        if (!dbPassword) {
             console.log("❌ CRITICAL ERROR: Password column is missing! Columns found:", Object.keys(user));
             return res.status(500).json({ error: "Server database configuration error." });
        }

        const isMatch = await bcrypt.compare(password, dbPassword);
        
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.status(200).json({ message: "Login successful!", user: user });
    });
});

// ==========================================
// 3. TEMPORARY SETUP ROUTES
// ==========================================
app.get('/setup-admin', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        pool.query("INSERT INTO admin (email, password) VALUES (?, ?)", ['admin@mycart.com', hashedPassword], (err) => {
            if (err) return res.status(500).send("Database error: " + err.message);
            res.send("✅ Admin user successfully created! You can now log in.");
        });
    } catch (error) {
        res.status(500).send("Server error: " + error.message);
    }
});

app.get('/reset-admin', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        pool.query("UPDATE admin SET password = ? WHERE email = ?", [hashedPassword, 'admin@mycart.com'], (err, result) => {
            if (err) return res.status(500).send("Database error: " + err.message);
            if (result.affectedRows === 0) return res.send("❌ Error: No admin found with that email.");
            res.send("✅ Admin password successfully RESET! You can now log in with: password123");
        });
    } catch (error) {
        res.status(500).send("Server error: " + error.message);
    }
});

// ==========================================
// SERVER START
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ MyCart Server is running on port ${PORT}`);
});