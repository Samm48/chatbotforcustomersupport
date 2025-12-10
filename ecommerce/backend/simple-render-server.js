const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// CORS for Render
app.use(cors({
  origin: ['http://localhost:3000', 'https://ecommerce-frontend.onrender.com'],
  credentials: true
}));
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

// ========== ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running on Render',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json({ products: result.rows });
  } catch (error) {
    console.error('Products error:', error);
    // Fallback products
    res.json({
      products: [
        { id: 1, name: 'Wireless Headphones', price: 199.99, category: 'Electronics' },
        { id: 2, name: 'Smart Watch', price: 299.99, category: 'Electronics' },
        { id: 3, name: 'Running Shoes', price: 89.99, category: 'Sports' },
        { id: 4, name: 'Coffee Maker', price: 149.99, category: 'Home' },
        { id: 5, name: 'Laptop Backpack', price: 79.99, category: 'Accessories' }
      ]
    });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple demo login
  if (email === 'demo@example.com' && password === 'demo123') {
    res.json({
      success: true,
      token: 'demo-jwt-token-for-render',
      user: {
        id: 1,
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials. Use demo@example.com / demo123'
    });
  }
});

// Chat endpoint
app.post('/api/chat/send', (req, res) => {
  const { message, userId = 1 } = req.body;
  
  const responses = {
    'product': "We offer electronics, sports gear, home appliances, and accessories! What are you looking for?",
    'order': "Check your order status in your account. Need help with a specific order?",
    'shipping': "Free shipping on orders over $50. Delivery: 3-5 business days.",
    'hello': "Hi! I'm your AI shopping assistant. How can I help?",
    'default': "I can help with products, orders, shipping, and returns. Ask me anything!"
  };
  
  let response = responses.default;
  const msg = message.toLowerCase();
  if (msg.includes('product')) response = responses.product;
  else if (msg.includes('order')) response = responses.order;
  else if (msg.includes('shipping')) response = responses.shipping;
  else if (msg.includes('hello') || msg.includes('hi')) response = responses.hello;
  
  res.json({
    success: true,
    userMessage: { message, timestamp: new Date() },
    botMessage: { message: response, timestamp: new Date(), isBot: true }
  });
});

// Chat history
app.get('/api/chat/history', (req, res) => {
  const { userId = 1 } = req.query;
  
  res.json({
    success: true,
    messages: [
      {
        id: 1,
        user_id: userId,
        message: "Welcome to ShopSmart! How can I assist you today?",
        is_bot: true,
        created_at: new Date()
      }
    ]
  });
});

// Cart endpoint
app.get('/api/cart', (req, res) => {
  res.json({
    success: true,
    cartItems: []
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'E-commerce API is running',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      login: 'POST /api/auth/login',
      chat: 'POST /api/chat/send'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Simple Render server running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`🛍️  Products: http://localhost:${PORT}/api/products`);
  console.log(`🔐 Demo: demo@example.com / demo123`);
});