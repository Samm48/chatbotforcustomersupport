const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecommerce_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function testConnection() {
  let client;
  try {
    console.log('🔌 Testing PostgreSQL connection...');
    console.log(`📊 Connection details:`);
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    
    client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully!');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('📋 PostgreSQL Version:', result.rows[0].version);
    
    // Check if database exists and is accessible
    const dbResult = await client.query('SELECT current_database()');
    console.log('💾 Connected to database:', dbResult.rows[0].current_database);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check if PostgreSQL service is running');
    console.log('2. Verify the password in .env file');
    console.log('3. Make sure database "ecommerce_db" exists');
    console.log('4. Check if PostgreSQL is on port 5432');
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testConnection();