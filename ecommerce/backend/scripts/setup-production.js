const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function setupProductionDatabase() {
  let client;
  
  try {
    console.log('🚀 Setting up production database on Render...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Use Render's DATABASE_URL directly
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ Connected to Render PostgreSQL database');

    // Create tables (same as your existing setup but simplified for production)
    console.log('📋 Creating tables...');
    
    await client.query(`
      DROP TABLE IF EXISTS chat_messages CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

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
          name VARCHAR(255) UNIQUE NOT NULL,
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

    // Insert sample data
    console.log('📥 Inserting sample data...');
    await client.query(`
      INSERT INTO products (name, description, price, stock_quantity, category, image_url) VALUES
      ('Wireless Headphones', 'High-quality wireless headphones with active noise cancellation', 199.99, 50, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'),
      ('Smart Watch', 'Feature-rich smartwatch with heart rate monitoring', 299.99, 30, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'),
      ('Running Shoes', 'Comfortable running shoes for all terrains', 89.99, 100, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400');
    `);

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    await client.query(
      'INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4)',
      ['demo@example.com', hashedPassword, 'Demo', 'User']
    );

    console.log('🎉 Production database setup completed!');
    console.log('👤 Demo user: demo@example.com / demo123');
    
  } catch (error) {
    console.error('❌ Production database setup failed:', error.message);
    throw error;
  } finally {
    if (client) await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupProductionDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = setupProductionDatabase;