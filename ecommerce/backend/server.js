const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');

const app = express();

// Configure CORS for your frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'https://samm48.github.io'],
  credentials: true
}));
app.use(express.json());

// Database connection for Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/ecommerce',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Test database
pool.connect((err, client, release) => {
  if (err) {
    console.log('⚠️ Database warning:', err.message);
  } else {
    console.log('✅ Database connected');
    release();
    
    // Setup tables if needed
    setupDatabase();
  }
});

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'https://samm48.github.io'],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Join admin room
  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('👨‍💼 Admin joined admin room');
    io.to('admin-room').emit('admin-message', 'Welcome to admin dashboard');
  });
  
  // Join customer room
  socket.on('join-customer', (userId) => {
    socket.join(`customer-${userId}`);
    console.log(`🛒 Customer ${userId} joined`);
  });
  
  // Handle new order (from customer)
  socket.on('new-order', (orderData) => {
    console.log('🛍️ New order received:', orderData.id);
    
    // Save order to database
    saveOrderToDatabase(orderData).then(() => {
      // Notify all admins
      io.to('admin-room').emit('order-created', {
        ...orderData,
        timestamp: new Date(),
        notification: `New Order #${orderData.id} received`
      });
      
      // Notify specific customer
      io.to(`customer-${orderData.userId}`).emit('order-confirmed', {
        ...orderData,
        message: `Your order #${orderData.id} has been confirmed`
      });
    });
  });
  
  // Handle product updates (from admin)
  socket.on('product-updated', async (productData) => {
    console.log('📦 Product updated:', productData.id);
    
    try {
      // Update in database
      await updateProductInDatabase(productData);
      
      // Notify all connected clients
      io.emit('product-changed', {
        ...productData,
        action: productData.id ? 'updated' : 'created',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error updating product:', error);
    }
  });
  
  // Handle product deletion (from admin)
  socket.on('product-deleted', async (productId) => {
    console.log('🗑️ Product deleted:', productId);
    
    try {
      // Delete from database
      await deleteProductFromDatabase(productId);
      
      // Notify all connected clients
      io.emit('product-removed', {
        productId: productId,
        timestamp: new Date(),
        message: 'Product removed from inventory'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  });
  
  // Handle chat messages
  socket.on('send-chat-message', (messageData) => {
    console.log('💬 Chat message from user:', messageData.userId);
    
    // Generate AI response
    const aiResponse = generateAIResponse(messageData.message);
    
    // Send response back to client
    socket.emit('receive-chat-message', {
      sender: 'ai-bot',
      message: aiResponse,
      timestamp: new Date(),
      type: 'response'
    });
    
    // Also broadcast to admin room
    io.to('admin-room').emit('customer-chat', {
      userId: messageData.userId,
      message: messageData.message,
      timestamp: new Date(),
      type: 'inquiry'
    });
  });
  
  // Handle live visitor count
  socket.on('get-visitor-count', () => {
    const visitorCount = io.engine.clientsCount;
    socket.emit('visitor-count', visitorCount);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    
    // Update visitor count for remaining clients
    const visitorCount = io.engine.clientsCount;
    io.emit('visitor-update', visitorCount);
  });
});

// AI Response Generator
function generateAIResponse(message) {
  const responses = {
    'product': "We have a wide range of products including electronics, sports gear, home appliances, and accessories. All prices are in Kenyan Shillings (KSH)!",
    'order': "To track your order, please check your account dashboard or contact support with your order number.",
    'shipping': "We offer free shipping on orders over KSH 10,000. Standard delivery takes 3-5 business days. Express shipping is available for KSH 1,500.",
    'return': "We have a 30-day return policy. Items must be in original condition with tags. Start returns from your order history.",
    'price': "Our prices are competitive and we offer regular discounts. Check our promotions page for current offers!",
    'payment': "We accept MPesa, credit cards, and mobile banking. All payments are secure.",
    'default': "I'm here to help with products, orders, shipping, returns, and general questions. What would you like to know?"
  };
  
  const msg = message.toLowerCase();
  
  if (msg.includes('product') || msg.includes('item') || msg.includes('buy')) {
    return responses.product;
  } else if (msg.includes('order') || msg.includes('track') || msg.includes('delivery')) {
    return responses.order;
  } else if (msg.includes('shipping') || msg.includes('deliver') || msg.includes('arrive')) {
    return responses.shipping;
  } else if (msg.includes('return') || msg.includes('refund') || msg.includes('exchange')) {
    return responses.return;
  } else if (msg.includes('price') || msg.includes('cost') || msg.includes('expensive')) {
    return responses.price;
  } else if (msg.includes('payment') || msg.includes('pay') || msg.includes('mpesa')) {
    return responses.payment;
  } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hello! I'm your AI shopping assistant. How can I help you today?";
  } else {
    return responses.default;
  }
}

// Database setup function
async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Setting up database tables...');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        image_url VARCHAR(500),
        stock_quantity INTEGER DEFAULT 10,
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_amount DECIMAL(10, 2) NOT NULL,
        shipping_address TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      );
    `);
    
    // Check if products exist
    const productCount = await client.query('SELECT COUNT(*) FROM products');
    
    if (parseInt(productCount.rows[0].count) === 0) {
      console.log('📦 Inserting sample KSH products...');
      
      await client.query(`
        INSERT INTO products (name, description, price, category, image_url, stock_quantity, featured) VALUES
        ('Wireless Headphones', 'Premium noise-canceling headphones', 30000, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 50, true),
        ('Smart Watch', 'Advanced fitness tracking smartwatch', 45000, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 30, true),
        ('Running Shoes', 'Comfortable athletic running shoes', 13500, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 100, false),
        ('Coffee Maker', 'Automatic coffee machine', 22500, 'Home', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 25, true),
        ('Laptop Backpack', 'Durable backpack for laptops', 12000, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 75, false),
        ('Smartphone', 'Latest smartphone with high-res camera', 105000, 'Electronics', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 40, true),
        ('Yoga Mat', 'Premium non-slip yoga mat', 7500, 'Sports', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', 80, false),
        ('Desk Lamp', 'Modern LED desk lamp', 6000, 'Home', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 60, false)
      `);
      
      console.log('✅ Sample products inserted!');
    }
    
    // Create demo users if not exist
    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, is_admin) VALUES
      ('demo@example.com', '$2a$10$demoCustomerHash1234567890', 'Demo', 'Customer', FALSE),
      ('admin@shopsmart.com', '$2a$10$demoAdminHash1234567890', 'Admin', 'User', TRUE)
      ON CONFLICT (email) DO NOTHING;
    `);
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
  } finally {
    client.release();
  }
}

// Database helper functions
async function saveOrderToDatabase(orderData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, status) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [orderData.userId, orderData.total, orderData.shippingAddress || 'N/A', 'pending']
    );
    
    const orderId = orderResult.rows[0].id;
    
    // Insert order items
    for (const item of orderData.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) 
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }
    
    await client.query('COMMIT');
    console.log(`✅ Order ${orderId} saved to database`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving order:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function updateProductInDatabase(productData) {
  const client = await pool.connect();
  
  try {
    if (productData.id) {
      // Update existing product
      await client.query(
        `UPDATE products 
         SET name = $1, description = $2, price = $3, category = $4, 
             image_url = $5, stock_quantity = $6, featured = $7 
         WHERE id = $8`,
        [
          productData.name,
          productData.description,
          productData.price,
          productData.category,
          productData.image_url,
          productData.stock_quantity,
          productData.featured || false,
          productData.id
        ]
      );
      console.log(`✅ Product ${productData.id} updated in database`);
    } else {
      // Insert new product
      await client.query(
        `INSERT INTO products (name, description, price, category, image_url, stock_quantity, featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          productData.name,
          productData.description,
          productData.price,
          productData.category,
          productData.image_url,
          productData.stock_quantity,
          productData.featured || false
        ]
      );
      console.log('✅ New product inserted into database');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function deleteProductFromDatabase(productId) {
  const client = await pool.connect();
  
  try {
    await client.query('DELETE FROM products WHERE id = $1', [productId]);
    console.log(`✅ Product ${productId} deleted from database`);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ========== API ENDPOINTS ==========

// Health check
app.get('/api/health', (req, res) => {
  const visitorCount = io.engine.clientsCount;
  res.json({ 
    status: 'OK', 
    timestamp: new Date(), 
    currency: 'KSH',
    realtime: {
      connectedClients: visitorCount,
      socketStatus: 'active'
    }
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, price, category, 
             image_url, stock_quantity, featured 
      FROM products 
      ORDER BY featured DESC, id
    `);
    
    if (result.rows.length === 0) {
      // Fallback to demo products in KSH
      res.json({
        products: getDemoProducts(),
        source: 'demo'
      });
    } else {
      res.json({ 
        products: result.rows,
        source: 'database'
      });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.json({
      products: getDemoProducts(),
      source: 'fallback'
    });
  }
});

function getDemoProducts() {
  return [
    { 
      id: 1, 
      name: 'Wireless Headphones', 
      price: 30000, 
      category: 'Electronics', 
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      stock_quantity: 50,
      featured: true,
      description: 'Premium wireless headphones with noise cancellation'
    },
    { 
      id: 2, 
      name: 'Smart Watch', 
      price: 45000, 
      category: 'Electronics', 
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      stock_quantity: 30,
      featured: true,
      description: 'Fitness tracker with heart rate monitor'
    },
    { 
      id: 3, 
      name: 'Running Shoes', 
      price: 13500, 
      category: 'Sports', 
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      stock_quantity: 100,
      featured: false,
      description: 'Professional running shoes with cushioning'
    },
    { 
      id: 4, 
      name: 'Coffee Maker', 
      price: 22500, 
      category: 'Home', 
      image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      stock_quantity: 25,
      featured: true,
      description: 'Automatic coffee maker with grinder'
    }
  ];
}

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({
        product: null,
        error: 'Product not found'
      });
    } else {
      res.json({ product: result.rows[0] });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update product (Admin endpoint)
app.post('/api/admin/products', async (req, res) => {
  try {
    const productData = req.body;
    
    if (productData.id) {
      // Update existing
      await updateProductInDatabase(productData);
      
      // Emit real-time update
      io.emit('product-changed', {
        ...productData,
        action: 'updated',
        timestamp: new Date()
      });
      
      res.json({ 
        success: true, 
        message: 'Product updated',
        product: productData 
      });
    } else {
      // Create new
      const client = await pool.connect();
      const result = await client.query(
        `INSERT INTO products (name, description, price, category, image_url, stock_quantity, featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          productData.name,
          productData.description,
          productData.price,
          productData.category,
          productData.image_url,
          productData.stock_quantity,
          productData.featured || false
        ]
      );
      client.release();
      
      const newProduct = result.rows[0];
      
      // Emit real-time update
      io.emit('product-changed', {
        ...newProduct,
        action: 'created',
        timestamp: new Date()
      });
      
      res.json({ 
        success: true, 
        message: 'Product created',
        product: newProduct 
      });
    }
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).json({ error: 'Failed to save product' });
  }
});

// Delete product (Admin endpoint)
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    await deleteProductFromDatabase(productId);
    
    // Emit real-time delete
    io.emit('product-removed', {
      productId: productId,
      timestamp: new Date(),
      message: 'Product removed from inventory'
    });
    
    res.json({ 
      success: true, 
      message: 'Product deleted' 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ========== CART ENDPOINTS ==========

let demoCart = [];

app.get('/api/cart', (req, res) => {
  res.json({ 
    cartItems: demoCart,
    currency: 'KSH'
  });
});

app.post('/api/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  
  // In real app, fetch from database
  const demoProduct = getDemoProducts().find(p => p.id == productId);
  
  if (demoProduct) {
    const existingItem = demoCart.find(item => item.id == productId);
    
    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      demoCart.push({
        ...demoProduct,
        quantity: quantity || 1
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Added to cart',
      cartCount: demoCart.length 
    });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.put('/api/cart/:id', (req, res) => {
  const itemId = req.params.id;
  const { quantity } = req.body;
  
  const item = demoCart.find(item => item.id == itemId);
  if (item) {
    item.quantity = quantity;
    res.json({ success: true, message: 'Cart updated' });
  } else {
    res.status(404).json({ error: 'Item not found in cart' });
  }
});

app.delete('/api/cart/:id', (req, res) => {
  const itemId = req.params.id;
  demoCart = demoCart.filter(item => item.id != itemId);
  res.json({ success: true, message: 'Item removed' });
});

// ========== ORDER ENDPOINTS ==========

let demoOrders = [];

app.get('/api/orders/my-orders', (req, res) => {
  res.json({ 
    orders: demoOrders,
    total: demoOrders.length
  });
});

app.post('/api/orders', (req, res) => {
  const order = {
    id: Date.now(),
    created_at: new Date(),
    status: 'processing',
    total_amount: demoCart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    items: [...demoCart],
    userId: req.body.userId || 1
  };
  
  demoOrders.push(order);
  
  // Emit real-time order notification via Socket.io
  io.emit('order-created', {
    ...order,
    timestamp: new Date(),
    notification: `New Order #${order.id} received`
  });
  
  demoCart = []; // Clear cart
  
  res.json({ 
    success: true, 
    orderId: order.id,
    message: 'Order placed successfully' 
  });
});

// ========== AUTH ENDPOINTS ==========

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo authentication
  let user;
  if (email === 'admin@shopsmart.com' && password === 'admin123') {
    user = {
      id: 999,
      email: email,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true
    };
  } else if (email === 'demo@example.com' && password === 'password123') {
    user = {
      id: 1,
      email: email,
      firstName: 'Demo',
      lastName: 'Customer',
      isAdmin: false
    };
  } else {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({
    success: true,
    token: 'demo-jwt-token-' + Date.now(),
    user: user
  });
});

// ========== ADMIN ENDPOINTS ==========

app.get('/api/admin/stats', (req, res) => {
  const stats = {
    totalProducts: getDemoProducts().length,
    totalOrders: demoOrders.length,
    totalRevenue: demoOrders.reduce((sum, order) => sum + order.total_amount, 0),
    pendingOrders: demoOrders.filter(o => o.status === 'pending').length,
    visitorCount: io.engine.clientsCount,
    timestamp: new Date()
  };
  
  res.json(stats);
});

// Get all orders (Admin)
app.get('/api/admin/orders', (req, res) => {
  res.json({
    orders: demoOrders,
    total: demoOrders.length
  });
});

// Update order status (Admin)
app.put('/api/admin/orders/:id/status', (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.body;
  
  const order = demoOrders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    
    // Emit real-time status update
    io.emit('order-status-updated', {
      orderId: orderId,
      status: status,
      timestamp: new Date()
    });
    
    res.json({ success: true, message: 'Order status updated' });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  const visitorCount = io.engine.clientsCount;
  
  res.json({
    message: 'ShopSmart E-commerce Backend API',
    version: '2.0',
    features: ['real-time', 'socket.io', 'postgresql', 'admin-dashboard'],
    endpoints: [
      '/api/health',
      '/api/products',
      '/api/products/:id',
      '/api/cart',
      '/api/orders/my-orders',
      '/api/auth/login',
      '/api/admin/stats',
      '/api/admin/products',
      '/api/admin/orders'
    ],
    realtime: {
      connectedClients: visitorCount,
      socketEnabled: true
    },
    currency: 'KSH (Kenyan Shillings)'
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io ready for real-time updates`);
  console.log(`💰 All prices in KSH (Kenyan Shillings)`);
  console.log(`🌐 WebSocket URL: ws://localhost:${PORT}`);
});