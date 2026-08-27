const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./store.db');

db.serialize(async () => {
  // 1. Separate Customer Data Table
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0
  )`);

  // 2. Separate Product Data Table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    stock INTEGER DEFAULT 50,
    rating REAL DEFAULT 4.5
  )`);

  // 3. Hardcoded Admin Setup (Email: admin@store.com | Password: AdminPassword123)
  const hashedAdminPass = await bcrypt.hash('AdminPassword123', 10);
  db.run(
    `INSERT OR IGNORE INTO customers (id, name, email, password, is_admin) 
     VALUES (1, 'System Administrator', 'admin@store.com', ?, 1)`,
    [hashedAdminPass]
  );

  // 4. Bulk Generator: Insert 1,000 Products across categories
  db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
    if (row.count < 1000) {
      console.log("Seeding 1,000 products into SQL database...");
      const categories = ['Electronics', 'Fashion', 'Grocery', 'Home'];
      const prefixes = ['Wireless', 'Smart', 'Premium', 'Ultra', 'Organic', 'Ergonomic', 'Pro', 'Compact'];
      const items = ['Headphones', 'Watch', 'Shirt', 'Coffee', 'Chair', 'Backpack', 'Monitor', 'Blender'];
      
      const stmt = db.prepare(`INSERT INTO products (title, price, category, image_url, stock, rating) VALUES (?, ?, ?, ?, ?, ?)`);
      
      for (let i = 1; i <= 1000; i++) {
        const cat = categories[i % categories.length];
        const title = `${prefixes[i % prefixes.length]} ${items[i % items.length]} #${i}`;
        const price = Math.floor(Math.random() * 9500) + 500;
        const img = `https://picsum.photos/seed/${i}/300/300`;
        const rating = (3.5 + Math.random() * 1.5).toFixed(1);
        
        stmt.run(title, price, cat, img, 50, rating);
      }
      stmt.finalize();
      console.log("1,000 Products Seeded Successfully!");
    }
  });
});

module.exports = db;