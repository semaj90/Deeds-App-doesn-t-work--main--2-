import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'prosecutor_db',
  user: 'postgres',
  password: 'postgres'
});

async function createHashVerificationTable() {
  console.log('Creating hash verification tracking table...');
  
  try {
    await client.connect();
    
    // Create hash_verifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS hash_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        evidence_id UUID REFERENCES evidence(id) ON DELETE CASCADE,
        verified_hash VARCHAR(64) NOT NULL,
        stored_hash VARCHAR(64),
        result BOOLEAN NOT NULL,
        verification_method VARCHAR(50) DEFAULT 'manual',
        verified_by UUID REFERENCES users(id),
        verified_at TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hash_verifications_evidence_id 
      ON hash_verifications(evidence_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hash_verifications_verified_hash 
      ON hash_verifications(verified_hash)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hash_verifications_verified_at 
      ON hash_verifications(verified_at)
    `);
    
    console.log('✅ Hash verification tracking table created successfully');
    
    // Verify table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'hash_verifications'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating hash verification table:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createHashVerificationTable()
  .then(() => {
    console.log('\\n🎉 Hash verification tracking is ready!');
    console.log('You can now track:');
    console.log('- Hash verification attempts');
    console.log('- Verification results and methods');
    console.log('- User activity and timestamps');
    console.log('- Evidence integrity history');
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
