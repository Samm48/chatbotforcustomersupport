// backend/server.js - COMPLETE VERSION
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

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

async function setupDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        image_url VARCHAR(500),
        stock_quantity INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert sample products in KSH
    const hasProducts = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(hasProducts.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, description, price, category, image_url, stock_quantity) VALUES
        ('Wireless Headphones', 'Premium noise-canceling headphones', 30000, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 50),
        ('Smart Watch', 'Advanced fitness tracking smartwatch', 45000, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 30),
        ('Running Shoes', 'Comfortable athletic running shoes', 13500, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 100),
        ('Coffee Maker', 'Automatic coffee machine', 22500, 'Home', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 25)
      `);
      console.log('✅ Sample products inserted');
    }
  } catch (error) {
    console.log('⚠️ Database setup warning:', error.message);
  }
}

// ========== API ENDPOINTS ==========
// In your /api/products endpoint or database setup
const productsWithImages = [
    { 
        id: 1, 
        name: 'Wireless Headphones', 
        price: 30000, 
        category: 'Electronics', 
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop' 
    },
    { 
        id: 2, 
        name: 'Smart Watch', 
        price: 45000, 
        category: 'Electronics', 
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w-400&auto=format&fit=crop' 
    },
    { 
        id: 3, 
        name: 'Running Shoes', 
        price: 13500, 
        category: 'Sports', 
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop' 
    },
    { 
        id: 4, 
        name: 'Coffee Maker', 
        price: 22500, 
        category: 'Home', 
        image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop' 
    }
];
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), currency: 'KSH' });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    
    if (result.rows.length === 0) {
      // Fallback to demo products in KSH
      res.json({
        products: [
          { id: 1, name: 'Wireless Headphones', price: 30000, category: 'Electronics', image_url: 'https://via.placeholder.com/200' },
          { id: 2, name: 'Smart Watch', price: 45000, category: 'Electronics', image_url: 'https://via.placeholder.com/200' },
          { id: 3, name: 'Running Shoes', price: 13500, category: 'Sports', image_url: 'https://via.placeholder.com/200' },
          { id: 4, name: 'Coffee Maker', price: 22500, category: 'Home', image_url: 'https://via.placeholder.com/200' }
        ]
      });
    } else {
      res.json({ products: result.rows });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.json({
      products: [
        { id: 1, name: 'Wireless Headphones', price: 30000, category: 'Electronics' },
        { id: 2, name: 'Smart Watch', price: 45000, category: 'Electronics' },
        { id: 3, name: 'Running Shoes', price: 13500, category: 'Sports' },
        { id: 4, name: 'Coffee Maker', price: 22500, category: 'Home' }
      ]
    });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      res.json({
        product: {
          id: req.params.id,
          name: 'Product Not Found',
          price: 0,
          category: 'General',
          description: 'Product not available',
          stock_quantity: 0
        }
      });
    } else {
      res.json({ product: result.rows[0] });
    }
  } catch (error) {
    res.json({
      product: {
        id: req.params.id,
        name: 'Demo Product',
        price: 10000,
        category: 'General',
        description: 'Demo product description',
        stock_quantity: 10
      }
    });
  }
});


// ========== CART ENDPOINTS ==========
app.get('/api/cart', (req, res) => {
  res.json({ 
    cartItems: [],
    message: 'Cart endpoint (demo mode)',
    currency: 'KSH'
  });
});

app.post('/api/cart/add', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Item added to cart (demo)'
  });
});

// ========== ORDERS ENDPOINTS ==========
app.get('/api/orders/my-orders', (req, res) => {
  res.json({ 
    orders: [
      {
        id: 1001,
        created_at: new Date(),
        status: 'delivered',
        total_amount: 35000,  // KSH amount
        items: [
          { name: 'Wireless Headphones', quantity: 1, price: 30000 },
          { name: 'Phone Case', quantity: 2, price: 2500 }
        ]
      }
    ]
  });
});

app.post('/api/orders', (req, res) => {
  res.json({ 
    success: true, 
    orderId: Math.floor(1000 + Math.random() * 9000),
    message: 'Order placed successfully (demo)'
  });
});

// ========== LOGIN ENDPOINT ==========
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    token: 'demo-jwt-token',
    user: {
      id: 1,
      email: req.body.email || 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User'
    }
  });
});
let demoCart = []; // For demo purposes

app.get('/api/cart', (req, res) => {
  res.json({ cartItems: demoCart });
});

app.post('/api/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  
  // Find product
  pool.query('SELECT * FROM products WHERE id = $1', [productId])
    .then(result => {
      if (result.rows.length > 0) {
        const product = result.rows[0];
        const existingItem = demoCart.find(item => item.id == productId);
        
        if (existingItem) {
          existingItem.quantity += quantity || 1;
        } else {
          demoCart.push({
            id: product.id,
            product_id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
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
    })
    .catch(error => {
      res.json({ success: true, message: 'Added to cart (demo mode)' });
    });
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
  res.json({ orders: demoOrders });
});

app.post('/api/orders', (req, res) => {
  const order = {
    id: Date.now(),
    created_at: new Date(),
    status: 'processing',
    total_amount: demoCart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    items: [...demoCart]
  };
  
  demoOrders.push(order);
  demoCart = []; // Clear cart
  
  res.json({ 
    success: true, 
    orderId: order.id,
    message: 'Order placed successfully' 
  });
});

// ========== USER ENDPOINTS ==========

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  res.json({
    success: true,
    token: 'demo-jwt-token',
    user: {
      id: 1,
      email: email || 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'E-commerce Backend API',
    version: '1.0',
    endpoints: [
      '/api/health',
      '/api/products',
      '/api/products/:id',
      '/api/cart',
      '/api/orders/my-orders',
      '/api/auth/login'
    ],
    currency: 'KSH (Kenyan Shillings)'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💰 All prices in KSH (Kenyan Shillings)`);
});
// Add this function to your server.js
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      );
    `);
    
    // Check if products exist
    const productCount = await client.query('SELECT COUNT(*) FROM products');
    
    if (parseInt(productCount.rows[0].count) === 0) {
      console.log('📦 Inserting KSH products...');
      
      await client.query(`
        INSERT INTO products (name, description, price, category, image_url, stock_quantity) VALUES
        ('Wireless Headphones', 'Premium noise-canceling headphones', 30000, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 50),
        ('Smart Watch', 'Advanced fitness tracking smartwatch', 45000, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 30),
        ('Running Shoes', 'Comfortable athletic running shoes', 13500, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 100),
        ('Coffee Maker', 'Automatic coffee machine', 22500, 'Home', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 25)
      `);
      
      console.log('✅ KSH products inserted!');
    } else {
      // Update existing products to KSH
      console.log('🔄 Updating prices to KSH...');
      await client.query(`
        UPDATE products SET price = 
        CASE 
          WHEN name = 'Wireless Headphones' THEN 30000
          WHEN name = 'Smart Watch' THEN 45000
          WHEN name = 'Running Shoes' THEN 13500
          WHEN name = 'Coffee Maker' THEN 22500
          WHEN name = 'Laptop Backpack' THEN 12000
          WHEN name = 'Smartphone' THEN 105000
          WHEN name = 'Yoga Mat' THEN 7500
          WHEN name = 'Desk Lamp' THEN 6000
          ELSE price * 150  -- Convert USD to KSH for others
        END
      `);
    }
    
    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
  } finally {
    client.release();
  }
}

// Call this after connecting to database
setupDatabase();