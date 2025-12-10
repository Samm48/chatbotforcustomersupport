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
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json({ products: result.rows });
  } catch (error) {
    console.log('Using fallback products');
    res.json({
      products: [
        { id: 1, name: 'Wireless Headphones', price: 199.99, category: 'Electronics' },
        { id: 2, name: 'Smart Watch', price: 299.99, category: 'Electronics' },
        { id: 3, name: 'Running Shoes', price: 89.99, category: 'Sports' }
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