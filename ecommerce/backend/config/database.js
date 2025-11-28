const { Pool } = require('pg');
require('dotenv').config();

// Production database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    if (process.env.NODE_ENV === 'production') {
      console.log('🌐 Production mode: PostgreSQL on Render');
    } else {
      console.log('💻 Development mode: Local PostgreSQL');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = { pool, connectDB };