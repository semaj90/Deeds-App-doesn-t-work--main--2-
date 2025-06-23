import { execSync } from 'child_process';
import pkg from 'pg';
const { Pool } = pkg;

/**
 * Global setup for Playwright tests
 * Sets up test database and ensures migrations are run
 */
async function globalSetup() {
  console.log('� Setting up test environment...');

  try {
    // Ensure database is ready
    console.log('� Running database migrations...');
    execSync('npm run db:migrate', { stdio: 'inherit' });

    // Test database connection
    console.log('🔌 Testing database connection...');
    const pool = new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'prosecutor_db',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
    });

    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    
    console.log('✅ Database connection successful');
    console.log('🎭 Test environment ready!');
    
  } catch (error) {
    console.error('❌ Failed to set up test environment:', error);
    throw error;
  }
}

export default globalSetup;
