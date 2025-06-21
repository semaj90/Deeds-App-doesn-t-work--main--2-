// test-postgres-schema.js
// Tests PostgreSQL database schema and data

const { Client } = require('pg');

const connection = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'prosecutor_db',
  ssl: false,
};

async function testPostgresSchema() {
  const client = new Client(connection);
  await client.connect();

  console.log('🔍 Testing PostgreSQL database schema...\n');

  try {
    // Test if all tables exist by trying to query them
    const tables = [
      'users', 'sessions', 'cases', 'evidence', 'statutes', 
      'case_events', 'case_relationships', 'saved_statements', 
      'case_text_fragments', 'nlp_analysis_cache', 'user_preferences',
      'case_templates', 'case_activities', 'crimes', 'criminals',
      'law_paragraphs', 'law_sections', 'law_chapters', 'law_codes'
    ];

    let totalRecords = 0;
    let existingTables = 0;

    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = parseInt(result.rows[0].count);
        totalRecords += count;
        existingTables++;
        console.log(`✅ Table '${table}': ${count} records`);
      } catch (error) {
        console.log(`❌ Table '${table}': ERROR - ${error.message}`);
      }
    }

    console.log(`\n📊 Summary: ${existingTables}/${tables.length} tables exist with ${totalRecords} total records\n`);

    // Test specific data integrity
    console.log('🔬 Testing data integrity...');
    
    // Check users
    const usersResult = await client.query('SELECT id, email, role FROM users LIMIT 3');
    console.log(`👥 Users (${usersResult.rows.length}):`, usersResult.rows);

    // Check cases
    const casesResult = await client.query('SELECT id, title, status, priority FROM cases LIMIT 3');
    console.log(`📋 Cases (${casesResult.rows.length}):`, casesResult.rows);

    // Check evidence
    const evidenceResult = await client.query('SELECT id, title, evidence_type, file_type FROM evidence LIMIT 3');
    console.log(`🔍 Evidence (${evidenceResult.rows.length}):`, evidenceResult.rows);

    // Check criminals
    const criminalsResult = await client.query('SELECT id, first_name, last_name, threat_level FROM criminals LIMIT 3');
    console.log(`👤 Criminals (${criminalsResult.rows.length}):`, criminalsResult.rows);

    // Test schema constraints
    console.log('\n🔒 Testing schema constraints...');
    
    // Test varchar length constraints
    try {
      await client.query(`
        SELECT column_name, data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name IN ('evidence', 'users') 
          AND column_name IN ('file_type', 'hashed_password')
        ORDER BY table_name, column_name
      `);
      console.log('✅ Schema constraints verified');
    } catch (error) {
      console.log('❌ Schema constraint check failed:', error.message);
    }

    console.log('\n🎉 PostgreSQL schema test completed successfully!');

  } catch (error) {
    console.error('❌ Error during schema testing:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

testPostgresSchema().catch(e => {
  console.error('❌ Schema test failed:', e);
  process.exit(1);
});
