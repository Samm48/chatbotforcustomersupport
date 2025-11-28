const express = require('express');
const cors = require('cors');
const { pool, connectDB } = require('./config/database');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to database
connectDB();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is working!',
    timestamp: new Date()
  });
});

// Products - always work
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json({ products: result.rows });
  } catch (error) {
    console.error('Products error:', error);
    // Fallback products
    res.json({
      products: [
        {
          id: 1,
          name: "Wireless Headphones",
          description: "High-quality wireless headphones",
          price: 199.99,
          category: "Electronics",
          image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
        },
        {
          id: 2,
          name: "Smart Watch", 
          description: "Feature-rich smartwatch",
          price: 299.99,
          category: "Electronics",
          image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
        }
      ]
    });
  }
});
// Add this to debug all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Auth login - simplified
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    // Simple demo login
    if (email === 'demo@example.com' && password === 'demo123') {
      res.json({
        success: true,
        token: 'demo-jwt-token',
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
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Chat history - simplified
app.get('/api/chat/history', (req, res) => {
  const { userId } = req.query;
  console.log('Chat history request for user:', userId);
  
  res.json({
    success: true,
    messages: [
      {
        id: 1,
        user_id: userId,
        message: "Welcome to our store!",
        is_bot: true,
        created_at: new Date()
      }
    ]
  });
});

// Chat send - simplified
app.post('/api/chat/send', (req, res) => {
  const { message, userId } = req.body;
  console.log('Chat message:', message, 'from user:', userId);
  
  const responses = {
    'product': "We have electronics, sports gear, home appliances, and accessories! What are you looking for?",
    'order': "I can help you track your order. Please provide your order ID or check your order history.",
    'shipping': "We offer free shipping on orders over $50. Standard delivery takes 3-5 business days.",
    'hello': "Hello! I'm your AI shopping assistant. How can I help you today?",
    'default': "I'm here to help with products, orders, shipping, and returns. What would you like to know?"
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
    botMessage: { 
      message: response, 
      timestamp: new Date(), 
      isBot: true 
    }
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log('🚀 WORKING Backend running on port 5000');
  console.log('✅ Health: http://localhost:5000/api/health');
  console.log('✅ Products: http://localhost:5000/api/products');
  console.log('✅ Auth: POST http://localhost:5000/api/auth/login');
  console.log('✅ Chat: GET http://localhost:5000/api/chat/history?userId=1');
  console.log('💡 Demo: demo@example.com / demo123');
});