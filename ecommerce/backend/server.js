const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
if (process.env.NODE_ENV === 'production') {
  require('dotenv').config();
} else {
  require('dotenv').config({ path: './.env' });
}

const { pool, connectDB } = require('./config/database');

const app = express();
const server = http.createServer(app);

// Configure CORS for Render
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://ecommerce-frontend.onrender.com'
].filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'CORS policy: Origin not allowed';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Health check route (must come before wildcard)
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Backend is running on Render',
      timestamp: new Date(),
      environment: process.env.NODE_ENV
    });
  });
  
  // API routes (must come before wildcard)
  setupRoutes(app);
  
  // Serve frontend for all other routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  });
} else {
  // Development routes
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Backend is running locally',
      timestamp: new Date(),
      environment: process.env.NODE_ENV
    });
  });
  
  setupRoutes(app);
}

function setupRoutes(app) {
  // Database connection
  connectDB();

  // Simple authentication middleware
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // For development, allow demo access
    if (!token && process.env.NODE_ENV !== 'production') {
      req.user = { userId: 1, email: 'demo@example.com' };
      return next();
    }

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  };

  // AI Response Generator
  const generateAIResponse = async (userMessage, userId = null) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const message = userMessage.toLowerCase();
    
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
            return `I found "${product.name}" - ${product.description}. It's $${product.price} (${product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}).`;
          } else {
            let response = `Found ${result.rows.length} products:\n`;
            result.rows.forEach((product, index) => {
              response += `\n${index + 1}. ${product.name} - $${product.price}`;
            });
            return response;
          }
        }
      } catch (error) {
        console.error('Product search error:', error);
      }
      return "We have electronics, sports gear, home appliances, and accessories. What type of product are you looking for?";
    }
    
    if (message.includes('order') || message.includes('track')) {
      return "You can check your order status in your account dashboard. Need help with a specific order?";
    }
    
    if (message.includes('shipping') || message.includes('delivery')) {
      return "Free shipping on orders over $50. Standard: 3-5 days, Express: 2 days ($15).";
    }
    
    if (message.includes('return') || message.includes('refund')) {
      return "30-day return policy. Items must be in original condition. Start returns from your order history.";
    }
    
    if (message.includes('hello') || message.includes('hi')) {
      return "Hello! I'm your shopping assistant. How can I help today?";
    }
    
    return "I can help with products, orders, shipping, and returns. What would you like to know?";
  };

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
      console.error('Products error:', error);
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
      console.error('Product error:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  // Auth API
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt for:', email);
      
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
        success: true,
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
      res.status(500).json({ 
        success: false,
        error: 'Login failed. Please try again.' 
      });
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
        success: true,
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
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = $1',
        [req.user.userId]
      );
      
      res.json({ 
        success: true,
        user: result.rows[0] 
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
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
      console.error('Chat history error:', error);
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
      console.error('Chat send error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message'
      });
    }
  });

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
      console.error('Cart error:', error);
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
      console.error('Add to cart error:', error);
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
      console.error('Orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // WebSocket for real-time chat
  io.on('connection', (socket) => {
    console.log('User connected to chat:', socket.id);

    socket.on('join_chat', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined chat`);
    });

    socket.on('send_message', async (data) => {
      try {
        const { message, userId } = data;
        
        // Save user message
        await pool.query(
          'INSERT INTO chat_messages (user_id, message, is_bot) VALUES ($1, $2, $3)',
          [userId, message, false]
        );

        // Generate AI response
        const aiResponse = await generateAIResponse(message, userId);
        
        // Save bot response
        await pool.query(
          'INSERT INTO chat_messages (user_id, message, response, is_bot) VALUES ($1, $2, $3, $4)',
          [userId, aiResponse, aiResponse, true]
        );

        // Send response
        socket.to(userId).emit('receive_message', {
          id: Date.now(),
          text: aiResponse,
          isBot: true,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('WebSocket error:', error);
        socket.emit('chat_error', { error: 'Failed to process message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`🛍️  Products: http://localhost:${PORT}/api/products`);
  console.log(`🔐 Demo login: demo@example.com / demo123`);
});