import { Client } from 'pg';

const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
  database: process.env.POSTGRES_DB || 'prosecutor_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

async function addHashField() {
  console.log('Connecting to database...');
  await client.connect();
  
  console.log('Adding hash field to evidence table...');
  
  try {
    // Add the hash column to the evidence table
    await client.query(`
      ALTER TABLE evidence 
      ADD COLUMN IF NOT EXISTS hash VARCHAR(64)
    `);
    
    console.log('✅ Successfully added hash field to evidence table');
    
    // Check if the column was added
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'evidence' AND column_name = 'hash'
    `);
    
    console.log('Hash column details:', result.rows);
    
  } catch (error) {
    console.error('❌ Error adding hash field:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the migration
addHashField()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
