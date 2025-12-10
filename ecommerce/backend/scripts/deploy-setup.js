const setupProductionDatabase = require('./setup-production');

async function deploySetup() {
  try {
    console.log('🚀 Starting production deployment setup...');
    await setupProductionDatabase();
    console.log('✅ Production setup completed successfully!');
  } catch (error) {
    console.error('❌ Deployment setup failed:', error.message);
    process.exit(1);
  }
}

// Only run if in production
if (process.env.NODE_ENV === 'production') {
  deploySetup();
}