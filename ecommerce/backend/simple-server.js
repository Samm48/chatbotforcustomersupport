const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple backend is running',
    timestamp: new Date()
  });
});

// Simple products endpoint
app.get('/api/products', (req, res) => {
  const products = [
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
    },
    {
      id: 3,
      name: "Running Shoes",
      description: "Comfortable running shoes",
      price: 89.99,
      category: "Sports", 
      image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"
    },
    {
      id: 4,
      name: "Coffee Maker",
      description: "Automatic coffee maker", 
      price: 149.99,
      category: "Home",
      image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400"
    },
    {
      id: 5,
      name: "Laptop Backpack",
      description: "Durable backpack",
      price: 79.99,
      category: "Accessories",
      image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"
    },
    {
      id: 6, 
      name: "Smartphone",
      description: "Latest smartphone",
      price: 699.99,
      category: "Electronics",
      image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"
    },
    {
      id: 7,
      name: "Yoga Mat",
      description: "Premium yoga mat",
      price: 49.99, 
      category: "Sports",
      image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400"
    },
    {
      id: 8,
      name: "Desk Lamp",
      description: "Modern LED desk lamp",
      price: 39.99,
      category: "Home",
      image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
    }
  ];
  res.json({ products });
});

// Simple auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple mock login - always succeed
  res.json({
    token: 'mock-jwt-token',
    user: {
      id: 1,
      email: email || 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User'
    }
  });
});

// Simple chat endpoint
app.post('/api/chat/send', (req, res) => {
  const { message } = req.body;
  
  const responses = {
    'product': "We have electronics, sports gear, home appliances, and accessories!",
    'order': "I can help you track your order. Please provide your order ID.",
    'shipping': "We offer free shipping on orders over $50. Delivery takes 3-5 days.",
    'default': "I'm here to help! Ask me about products, orders, or shipping."
  };
  
  let response = responses.default;
  if (message.toLowerCase().includes('product')) response = responses.product;
  if (message.toLowerCase().includes('order')) response = responses.order; 
  if (message.toLowerCase().includes('shipping')) response = responses.shipping;
  
  res.json({
    success: true,
    userMessage: { message, timestamp: new Date() },
    botMessage: { message: response, timestamp: new Date(), isBot: true }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Simple backend running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`🛍️  Products: http://localhost:${PORT}/api/products`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/login`);
});