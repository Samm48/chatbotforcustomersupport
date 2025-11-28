if (process.env.NODE_ENV === 'production') {
  require('dotenv').config();
} else {
  require('dotenv').config({ path: './.env' });
}
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { pool, connectDB } = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Simple authentication middleware (for development)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // For development, allow demo access without token
  if (!token) {
    req.user = { userId: 1, email: 'demo@example.com' }; // Demo user
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Enhanced AI response generator
const generateAIResponse = async (userMessage, userId = null) => {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
  
  const message = userMessage.toLowerCase();
  
  // Product inquiries
  if (message.includes('product') || message.includes('item')) {
    try {
      const result = await pool.query(
        `SELECT name, description, price, stock_quantity, category 
         FROM products 
         WHERE name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1 
         LIMIT 3`,
        [`%${message}%`]
      );
      
      if (result.rows.length > 0) {
        if (result.rows.length === 1) {
          const product = result.rows[0];
          return `I found "${product.name}" - ${product.description}. It's priced at $${product.price} and is currently ${product.stock_quantity > 0 ? 'in stock' : 'out of stock'}. Would you like to know more about this product?`;
        } else {
          let response = `I found several products that might interest you:\n`;
          result.rows.forEach((product, index) => {
            response += `\n${index + 1}. ${product.name} - $${product.price} (${product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'})`;
          });
          response += `\n\nYou can view these products on our website or let me know if you'd like details about a specific one.`;
          return response;
        }
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
    
    return "We have a wide range of products including electronics, sports gear, home appliances, and accessories. You can browse our catalog or ask me about specific products!";
  }
  
  // Order status
  if (message.includes('order') || message.includes('track') || message.includes('status')) {
    if (userId) {
      try {
        const result = await pool.query(
          `SELECT o.id, o.status, o.total_amount, o.created_at 
           FROM orders o 
           WHERE o.user_id = $1 
           ORDER BY o.created_at DESC 
           LIMIT 1`,
          [userId]
        );
        
        if (result.rows.length > 0) {
          const order = result.rows[0];
          const statusDetails = {
            'pending': 'Your order is being processed and will ship soon.',
            'shipped': 'Your order is on its way! You should receive tracking information shortly.',
            'delivered': 'Your order has been delivered. We hope you enjoy your purchase!',
            'cancelled': 'This order has been cancelled.',
            'processing': 'We are currently preparing your order for shipment.'
          };
          
          return `Your most recent order #${order.id} is currently "${order.status}". ${statusDetails[order.status] || 'Your order is being processed.'} You can view all your orders in your account.`;
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    }
    
    return "I can help you check your order status. Please log in to your account to view your orders, or provide your order ID for assistance.";
  }
  
  // Shipping
  if (message.includes('shipping') || message.includes('delivery') || message.includes('arrive')) {
    return `We offer several shipping options:\n\n• **Free Standard Shipping**: 5-7 business days (orders over $50)\n• **Express Shipping**: 2-3 business days ($15)\n• **Overnight Shipping**: Next business day ($25)\n\nShipping times may vary based on your location.`;
  }
  
  // Returns
  if (message.includes('return') || message.includes('refund') || message.includes('exchange')) {
    return `Our return policy:\n\n• **30-Day Return Period**: Items can be returned within 30 days\n• **Condition**: Items must be in original condition with tags\n• **Refund Method**: Refunds to original payment method\n• **Process**: Initiate returns from your order history\n\nFor defective items, contact our support team.`;
  }
  
  // Account
  if (message.includes('account') || message.includes('login') || message.includes('password')) {
    return "For account-related issues, you can reset your password using the 'Forgot Password' link. For security-sensitive changes, contact our support team.";
  }
  
  // Greetings
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return "Hello! I'm your AI shopping assistant. How can I help you today?";
  }
  
  // Default response
  const defaultResponses = [
    "I'm here to help with your e-commerce needs! How can I assist you today?",
    "I can help you with product information, order status, shipping details, returns, and general inquiries.",
    "Welcome! Feel free to ask me about our products, orders, or any other questions."
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

// ==================== ROUTES ====================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT version()');
    res.json({ 
      status: 'OK', 
      message: 'E-commerce backend with PostgreSQL is running',
      database: 'PostgreSQL connected',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ products: result.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Auth API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name',
      [email, hashedPassword, firstName, lastName]
    );
    
    const token = jwt.sign(
      { userId: result.rows[0].id, email: result.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name
      }
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat API
app.get('/api/chat/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.userId]
    );
    
    res.json({ 
      success: true,
      messages: result.rows 
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load chat history' 
    });
  }
});

app.post('/api/chat/send', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot be empty'
      });
    }

    // Save user message
    const userMessageResult = await pool.query(
      'INSERT INTO chat_messages (user_id, message, is_bot) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, message.trim(), false]
    );

    // Generate AI response
    const aiResponse = await generateAIResponse(message, req.user.userId);

    // Save bot response
    const botMessageResult = await pool.query(
      'INSERT INTO chat_messages (user_id, message, response, is_bot) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, aiResponse, aiResponse, true]
    );

    res.json({
      success: true,
      userMessage: userMessageResult.rows[0],
      botMessage: botMessageResult.rows[0],
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error in chat send:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});// Update the static file serving for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
}

// Cart API
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.*, p.name, p.price, p.image_url, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [req.user.userId]
    );
    
    res.json({ 
      success: true,
      cartItems: result.rows 
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.post('/api/cart/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    // Check if item already in cart
    const existingItem = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.userId, productId]
    );
    
    if (existingItem.rows.length > 0) {
      // Update quantity
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
        [quantity, req.user.userId, productId]
      );
    } else {
      // Add new item
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [req.user.userId, productId, quantity]
      );
    }
    
    res.json({ 
      success: true,
      message: 'Item added to cart' 
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Orders API
app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, 
              json_agg(
                json_build_object(
                  'product_id', oi.product_id,
                  'quantity', oi.quantity,
                  'price', oi.price,
                  'name', p.name
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.userId]
    );
    
    res.json({ 
      success: true,
      orders: result.rows 
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ==================== WEB SOCKET ====================

io.on('connection', (socket) => {
  console.log('User connected to chat:', socket.id);

  socket.on('join_chat', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined chat room`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { message, userId } = data;
      
      // Save user message to database
      await pool.query(
        'INSERT INTO chat_messages (user_id, message, is_bot) VALUES ($1, $2, $3)',
        [userId, message, false]
      );

      // Generate AI response
      const aiResponse = await generateAIResponse(message, userId);
      
      // Save bot response to database
      await pool.query(
        'INSERT INTO chat_messages (user_id, message, response, is_bot) VALUES ($1, $2, $3, $4)',
        [userId, aiResponse, aiResponse, true]
      );

      // Send AI response
      socket.to(userId).emit('receive_message', {
        id: Date.now(),
        text: aiResponse,
        isBot: true,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('WebSocket chat error:', error);
      socket.emit('chat_error', { error: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from chat:', socket.id);
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Database: PostgreSQL connected`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🛍️  Products API: http://localhost:${PORT}/api/products`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat/send`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth/login`);
  console.log(`\n💡 Demo user: demo@example.com / demo123`);
})