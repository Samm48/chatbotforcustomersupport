const { Client } = require('pg');
require('dotenv').config();

async function setupProductionDatabase() {
  let client;
  
  try {
    console.log('🚀 Setting up production database...');
    
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ Connected to production database');
    
    // Run the same setup as development
    const setupScript = require('./setup-database-enhanced.js');
    
  } catch (error) {
    console.error('❌ Production setup failed:', error.message);
    process.exit(1);
  } finally {
    if (client) await client.end();
  }
}

// Only run if in production
if (process.env.NODE_ENV === 'production') {
  setupProductionDatabase();
}