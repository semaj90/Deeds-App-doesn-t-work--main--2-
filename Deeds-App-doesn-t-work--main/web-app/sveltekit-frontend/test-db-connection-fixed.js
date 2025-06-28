// Simple test to verify database connectivity and user data
import { db } from './src/lib/server/db/index.js';
import { users } from './src/lib/server/db/unified-schema.js';

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...\n');
    
    // Test basic query
    const userList = await db.select().from(users).limit(5);
    
    console.log(`✅ Database connected successfully!`);
    console.log(`📊 Found ${userList.length} users in database:`);
    
    userList.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
    });
    
    console.log('\n🎯 Database is ready for testing!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🚨 Please ensure:');
    console.log('1. Docker is running');
    console.log('2. PostgreSQL container is up');
    console.log('3. Database migrations have been run');
    console.log('4. .env file has correct database URL');
  }
}

testDatabaseConnection();
