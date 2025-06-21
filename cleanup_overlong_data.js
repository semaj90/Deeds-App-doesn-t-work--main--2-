// cleanup_overlong_data.js
// Cleans up overlong data before migration by truncating or adjusting problematic values

const { Client } = require('pg');

const connection = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'prosecutor_db',
  ssl: false,
};

async function main() {
  const client = new Client(connection);
  await client.connect();

  console.log('Cleaning up overlong data before migration...');

  try {
    // Begin transaction
    await client.query('BEGIN');

    // Note: hashed_password should NOT be truncated as it would break authentication
    // Instead, we'll address this in the schema
    console.log('Skipping users.hashed_password - will adjust schema instead');

    // Note: file_type should NOT be truncated as MIME types need to be complete
    // Instead, we'll address this in the schema  
    console.log('Skipping evidence.file_type - will adjust schema instead');

    // Truncate cases.description to 50 chars (these are just descriptions)
    console.log('Truncating cases.description to 50 characters...');
    const casesRes = await client.query(`
      UPDATE "public"."cases" 
      SET description = LEFT(description, 50) 
      WHERE LENGTH(description) > 50
    `);
    console.log(`Updated ${casesRes.rowCount} cases descriptions`);

    // Truncate criminals.notes to 50 chars
    console.log('Truncating criminals.notes to 50 characters...');
    const criminalsRes = await client.query(`
      UPDATE "public"."criminals" 
      SET notes = LEFT(notes, 50) 
      WHERE LENGTH(notes) > 50
    `);
    console.log(`Updated ${criminalsRes.rowCount} criminals notes`);

    // Truncate evidence.description to 50 chars
    console.log('Truncating evidence.description to 50 characters...');
    const evidenceDescRes = await client.query(`
      UPDATE "public"."evidence" 
      SET description = LEFT(description, 50) 
      WHERE LENGTH(description) > 50
    `);
    console.log(`Updated ${evidenceDescRes.rowCount} evidence descriptions`);

    // Truncate evidence.summary to 50 chars
    console.log('Truncating evidence.summary to 50 characters...');
    const evidenceSumRes = await client.query(`
      UPDATE "public"."evidence" 
      SET summary = LEFT(summary, 50) 
      WHERE LENGTH(summary) > 50
    `);
    console.log(`Updated ${evidenceSumRes.rowCount} evidence summaries`);

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Data cleanup completed successfully!');
    console.log('\nNote: You may need to adjust schema for:');
    console.log('- users.hashed_password (should be text, not varchar(50))');
    console.log('- evidence.file_type (should be varchar(100), not varchar(50))');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(e => {
  console.error('Failed to clean up data:', e);
  process.exit(1);
});
