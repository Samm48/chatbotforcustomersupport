const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Create database pool for Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL');
    release();
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'E-commerce API Running',
    status: 'OK',
    endpoints: ['/api/health', '/api/products', '/api/auth/login']
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Products endpoint
// Products endpoint - FIXED to return ALL products
app.get('/api/products', async (req, res) => {
  try {
    console.log('📦 Fetching ALL products from database...');
    
    // Try to get products from database
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    
    if (result.rows.length === 0) {
      console.log('⚠️ No products in database, inserting sample data...');
      
      // Insert sample products if database is empty
      await pool.query(`
        INSERT INTO products (name, description, price, category, image_url, stock_quantity) VALUES
        ('Wireless Headphones', 'Premium noise-canceling headphones', 199.99, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 50),
        ('Smart Watch', 'Advanced fitness tracking smartwatch', 299.99, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 30),
        ('Running Shoes', 'Comfortable athletic running shoes', 89.99, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 100),
        ('Coffee Maker', 'Automatic coffee machine', 149.99, 'Home', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 25),
        ('Laptop Backpack', 'Durable backpack for laptops', 79.99, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 75),
        ('Smartphone', 'Latest smartphone with high-res camera', 699.99, 'Electronics', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 40),
        ('Yoga Mat', 'Premium non-slip yoga mat', 49.99, 'Sports', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', 80),
        ('Desk Lamp', 'Modern LED desk lamp', 39.99, 'Home', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 60)
      `);
      
      // Fetch again after inserting
      const newResult = await pool.query('SELECT * FROM products ORDER BY id');
      console.log(`✅ Inserted ${newResult.rows.length} sample products`);
      res.json({ products: newResult.rows });
    } else {
      console.log(`✅ Returning ${result.rows.length} products from database`);
      res.json({ products: result.rows });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    
    // Fallback products if database fails
    res.json({
      products: [
        { id: 1, name: 'Wireless Headphones', price: 199.99, category: 'Electronics', description: 'Premium headphones' },
        { id: 2, name: 'Smart Watch', price: 299.99, category: 'Electronics', description: 'Advanced smartwatch' },
        { id: 3, name: 'Running Shoes', price: 89.99, category: 'Sports', description: 'Athletic shoes' },
        { id: 4, name: 'Coffee Maker', price: 149.99, category: 'Home', description: 'Coffee machine' },
        { id: 5, name: 'Laptop Backpack', price: 79.99, category: 'Accessories', description: 'Durable backpack' },
        { id: 6, name: 'Smartphone', price: 699.99, category: 'Electronics', description: 'Latest smartphone' },
        { id: 7, name: 'Yoga Mat', price: 49.99, category: 'Sports', description: 'Premium yoga mat' },
        { id: 8, name: 'Desk Lamp', price: 39.99, category: 'Home', description: 'LED desk lamp' }
      ]
    });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    token: 'demo-token',
    user: { id: 1, email: 'demo@example.com', firstName: 'Demo' }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});