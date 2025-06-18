#!/usr/bin/env node

/**
 * Database Switching Utility
 * Usage: npm run switch-db [sqlite|postgres]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
const dbType = process.argv[2];

if (!dbType || !['sqlite', 'postgres'].includes(dbType)) {
  console.error('❌ Usage: npm run switch-db [sqlite|postgres]');
  process.exit(1);
}

try {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  if (dbType === 'sqlite') {
    console.log('🔄 Switching to SQLite database...');
    
    // Comment out PostgreSQL URL and uncomment SQLite URL
    envContent = envContent.replace(
      /^DATABASE_URL="postgresql:\/\/.*$/m,
      '# DATABASE_URL="postgresql://postgres:your_password_here@localhost:5432/prosecutor_db"'
    );
    envContent = envContent.replace(
      /^# DATABASE_URL="file:\.\/.*$/m,
      'DATABASE_URL="file:./dev.db"'
    );
    
    console.log('✅ Switched to SQLite database (file:./dev.db)');
    console.log('💡 Run: npm run dev to start with SQLite');
    
  } else if (dbType === 'postgres') {
    console.log('🔄 Switching to PostgreSQL database...');
    
    // Comment out SQLite URL and uncomment PostgreSQL URL
    envContent = envContent.replace(
      /^DATABASE_URL="file:\.\/.*$/m,
      '# DATABASE_URL="file:./dev.db"'
    );
    envContent = envContent.replace(
      /^# DATABASE_URL="postgresql:\/\/.*$/m,
      'DATABASE_URL="postgresql://postgres:your_password_here@localhost:5432/prosecutor_db"'
    );
    
    console.log('✅ Switched to PostgreSQL database');
    console.log('💡 Make sure to:');
    console.log('   1. Update the DATABASE_URL with your actual PostgreSQL credentials');
    console.log('   2. Ensure PostgreSQL is running');
    console.log('   3. Run: npm run db:migrate');
    console.log('   4. Run: npm run dev');
  }
  
  fs.writeFileSync(envPath, envContent);
  
} catch (error) {
  console.error('❌ Error switching database:', error.message);
  process.exit(1);
}
