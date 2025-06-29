const { Client } = require('pg');

async function testDatabaseConnection() {
  console.log('🔍 Testing PostgreSQL connection...');
  
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'prosecutor_db',
    password: 'postgres',
    port: 5433,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('📦 Database version:', result.rows[0].version);
    
    // Test pgvector extension
    const vectorResult = await client.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
    if (vectorResult.rows.length > 0) {
      console.log('✅ pgvector extension is installed');
    } else {
      console.log('⚠️ pgvector extension not found');
    }
    
    // Test tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Test hash_verifications table specifically
    const hashTableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'hash_verifications'
      ORDER BY ordinal_position
    `);
    
    if (hashTableCheck.rows.length > 0) {
      console.log('✅ hash_verifications table structure:');
      hashTableCheck.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('❌ hash_verifications table not found');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  } finally {
    await client.end();
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
