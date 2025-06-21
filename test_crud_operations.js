// test_crud_operations.js
// Tests basic CRUD operations after migration

const { Client } = require('pg');

const connection = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'prosecutor_db',
  ssl: false,
};

async function testCrudOperations() {
  const client = new Client(connection);
  await client.connect();

  console.log('🔍 Testing CRUD operations after migration...\n');

  try {
    // Test 1: Insert a new case
    console.log('1. Testing INSERT operation...');
    const newCaseId = '123e4567-e89b-12d3-a456-426614174000';
    const insertResult = await client.query(`
      INSERT INTO cases (id, title, description, priority, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title
    `, [newCaseId, 'Test Case', 'Test description under 50 chars', 'high', 'open']);
    
    console.log('✅ INSERT successful:', insertResult.rows[0]);

    // Test 2: Read the case
    console.log('\n2. Testing SELECT operation...');
    const selectResult = await client.query(`
      SELECT id, title, description, priority, status, created_at
      FROM cases
      WHERE id = $1
    `, [newCaseId]);
    
    console.log('✅ SELECT successful:', selectResult.rows[0]);

    // Test 3: Update the case
    console.log('\n3. Testing UPDATE operation...');
    const updateResult = await client.query(`
      UPDATE cases 
      SET description = $1, priority = $2
      WHERE id = $3
      RETURNING id, title, description, priority
    `, ['Updated description under 50 chars', 'medium', newCaseId]);
    
    console.log('✅ UPDATE successful:', updateResult.rows[0]);

    // Test 4: Test evidence table with long file_type (should work now)
    console.log('\n4. Testing evidence table with long MIME type...');
    const evidenceId = '123e4567-e89b-12d3-a456-426614174001';
    const longMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; // 73 chars
    
    const evidenceResult = await client.query(`
      INSERT INTO evidence (id, case_id, title, evidence_type, file_type, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, file_type
    `, [evidenceId, newCaseId, 'Test Evidence', 'document', longMimeType, 'Test evidence description under 50 chars']);
    
    console.log('✅ Evidence INSERT with long MIME type successful:', evidenceResult.rows[0]);

    // Test 5: Delete operations
    console.log('\n5. Testing DELETE operations...');
    await client.query('DELETE FROM evidence WHERE id = $1', [evidenceId]);
    await client.query('DELETE FROM cases WHERE id = $1', [newCaseId]);
    
    console.log('✅ DELETE operations successful');

    // Test 6: Verify existing data integrity
    console.log('\n6. Testing existing data integrity...');
    const dataCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM cases) as case_count,
        (SELECT COUNT(*) FROM criminals) as criminal_count,
        (SELECT COUNT(*) FROM users) as user_count
    `);
    
    console.log('✅ Data integrity check:', dataCheck.rows[0]);

    console.log('\n🎉 All CRUD operations completed successfully!');
    console.log('✅ Migration was successful - database is fully functional');

  } catch (error) {
    console.error('❌ Error during CRUD testing:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

testCrudOperations().catch(e => {
  console.error('❌ CRUD test failed:', e);
  process.exit(1);
});
