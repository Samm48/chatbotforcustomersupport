const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('🚀 Starting database setup...');

    // Read and execute the init.sql file
    const initSqlPath = path.join(__dirname, '../init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    console.log('📦 Creating tables and inserting sample data...');
    await client.query(initSql);
    
    console.log('✅ Database setup completed successfully!');
    console.log('📊 Sample data inserted:');
    console.log('   - 8 products');
    console.log('   - 1 demo user (demo@example.com / password: demo123)');
    console.log('   - Sample order history');
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
    process.exit(0);
  }
}

setupDatabase();