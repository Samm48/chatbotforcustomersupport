const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// First, connect without specific database to check/create it
const adminConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres' // Connect to default postgres database first
};

async function setupDatabase() {
  let adminClient, client;
  
  try {
    console.log('🚀 Starting enhanced database setup...');
    
    // Step 1: Check if database exists, create if not
    adminClient = new Client(adminConfig);
    await adminClient.connect();
    
    console.log('🔍 Checking if database exists...');
    const dbCheck = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'ecommerce_db'"
    );
    
    if (dbCheck.rows.length === 0) {
      console.log('📦 Creating database "ecommerce_db"...');
      await adminClient.query('CREATE DATABASE ecommerce_db');
      console.log('✅ Database created successfully!');
    } else {
      console.log('✅ Database already exists.');
    }
    
    await adminClient.end();

    // Step 2: Now connect to ecommerce_db and setup tables
    const dbConfig = {
      ...adminConfig,
      database: 'ecommerce_db'
    };
    
    client = new Client(dbConfig);
    await client.connect();
    console.log('📊 Connected to ecommerce_db, creating tables...');

    // Drop tables if they exist (clean start)
    console.log('🧹 Cleaning existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS chat_messages CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create tables
    console.log('📋 Creating tables...');
    await client.query(`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Create tables
      CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,  -- Added UNIQUE constraint
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          stock_quantity INTEGER NOT NULL,
          image_url VARCHAR(500),
          category VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          total_amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          shipping_address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id),
          product_id INTEGER REFERENCES products(id),
          quantity INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL
      );

      CREATE TABLE cart_items (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          product_id INTEGER REFERENCES products(id),
          quantity INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE chat_messages (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          message TEXT NOT NULL,
          response TEXT,
          is_bot BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tables created successfully!');

    // Insert sample products
    console.log('📥 Inserting sample products...');
    await client.query(`
      INSERT INTO products (name, description, price, stock_quantity, category, image_url) VALUES
      ('Wireless Headphones', 'High-quality wireless headphones with active noise cancellation, 30-hour battery life, and premium sound quality. Perfect for music lovers and professionals.', 199.99, 50, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'),
      ('Smart Watch', 'Feature-rich smartwatch with heart rate monitoring, GPS, water resistance up to 50m, and smartphone connectivity. Track your fitness and stay connected.', 299.99, 30, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'),
      ('Running Shoes', 'Comfortable running shoes designed for all terrains. Features advanced cushioning, breathable mesh, and durable rubber soles for maximum performance.', 89.99, 100, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'),
      ('Coffee Maker', 'Automatic coffee maker with programmable settings, 12-cup capacity, and built-in grinder. Start your day with the perfect brew every morning.', 149.99, 25, 'Home', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'),
      ('Laptop Backpack', 'Durable backpack with laptop compartment, multiple pockets, and ergonomic design. Perfect for work, travel, or everyday use.', 79.99, 75, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'),
      ('Smartphone', 'Latest smartphone with high-resolution camera, fast processor, and all-day battery life. Stay connected and capture every moment.', 699.99, 40, 'Electronics', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'),
      ('Yoga Mat', 'Premium non-slip yoga mat with extra cushioning. Perfect for yoga, pilates, and floor exercises. Eco-friendly materials.', 49.99, 80, 'Sports', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'),
      ('Desk Lamp', 'Modern LED desk lamp with adjustable brightness and color temperature. USB charging ports and sleek design for any workspace.', 39.99, 60, 'Home', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400');
    `);

    // Create demo user
    console.log('👤 Creating demo user...');
    const hashedPassword = await bcrypt.hash('demo123', 10);
    await client.query(
      'INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4)',
      ['demo@example.com', hashedPassword, 'Demo', 'User']
    );

    // Create a sample order
    console.log('📦 Creating sample order...');
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES ($1, $2, $3, $4) RETURNING id',
      [1, 289.98, 'delivered', '123 Main St, City, State 12345']
    );
    
    const orderId = orderResult.rows[0].id;
    
    await client.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $1, $2, $3), ($1, $4, $5, $6)',
      [orderId, 1, 1, 199.99, 5, 1, 89.99]
    );

    // Create indexes
    console.log('⚡ Creating indexes...');
    await client.query(`
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_products_category ON products(category);
      CREATE INDEX idx_orders_user_id ON orders(user_id);
      CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
      CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
    `);

    // Verify data
    const productsCount = await client.query('SELECT COUNT(*) FROM products');
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    const ordersCount = await client.query('SELECT COUNT(*) FROM orders');
    
    console.log('🎉 Database setup completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${productsCount.rows[0].count} products created`);
    console.log(`   - ${usersCount.rows[0].count} users created`);
    console.log(`   - ${ordersCount.rows[0].count} orders created`);
    console.log('   - Demo user: demo@example.com / demo123');
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    console.log('💡 Make sure:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. Password in .env is correct');
  } finally {
    if (adminClient) await adminClient.end();
    if (client) await client.end();
    process.exit(0);
  }
}

setupDatabase();