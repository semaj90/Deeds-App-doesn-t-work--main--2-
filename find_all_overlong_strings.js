// find_all_overlong_strings.js
// Aggressively scans ALL text/varchar columns in ALL tables for values exceeding 50 characters

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

  console.log('Finding all text/varchar columns in all tables...');

  // Find all text/varchar columns in all schemas (including system ones)
  const columnsRes = await client.query(`
    SELECT table_schema, table_name, column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE data_type IN ('text', 'character varying', 'varchar', 'character')
      AND table_schema NOT IN ('information_schema', 'pg_catalog')
    ORDER BY table_schema, table_name, column_name;
  `);

  console.log(`Found ${columnsRes.rows.length} text/varchar columns to check.`);

  let found = false;
  let totalChecked = 0;

  for (const row of columnsRes.rows) {
    const { table_schema, table_name, column_name, data_type, character_maximum_length } = row;
    const fullTable = `"${table_schema}"."${table_name}"`;
    
    try {
      // Check if table exists and has data
      const countRes = await client.query(`SELECT COUNT(*) as count FROM ${fullTable}`);
      const rowCount = parseInt(countRes.rows[0].count);
      
      if (rowCount === 0) {
        console.log(`Skipping empty table: ${fullTable}`);
        continue;
      }

      console.log(`Checking ${fullTable}.${column_name} (${data_type}${character_maximum_length ? `(${character_maximum_length})` : ''}) - ${rowCount} rows`);
      
      const sql = `
        SELECT *, LENGTH("${column_name}") as len 
        FROM ${fullTable} 
        WHERE "${column_name}" IS NOT NULL 
          AND LENGTH("${column_name}") > 50
        LIMIT 5
      `;
      
      const res = await client.query(sql);
      totalChecked++;
      
      if (res.rows.length > 0) {
        found = true;
        console.log(`\n*** FOUND OVERLONG VALUES ***`);
        console.log(`Table: ${fullTable}, Column: ${column_name}`);
        console.log(`Data type: ${data_type}${character_maximum_length ? `(${character_maximum_length})` : ''}`);
        console.log(`${res.rows.length} rows with values > 50 chars:`);
        res.rows.forEach((r, i) => {
          console.log(`  Row ${i + 1}: Length=${r.len}, Value="${r[column_name].substring(0, 100)}${r[column_name].length > 100 ? '...' : ''}"`);
        });
        console.log('');
      }
    } catch (e) {
      console.error(`Error querying ${fullTable}.${column_name}:`, e.message);
    }
  }

  console.log(`\nChecked ${totalChecked} columns in total.`);
  
  if (!found) {
    console.log('No values longer than 50 characters found in any text/varchar columns.');
  } else {
    console.log('\n*** SUMMARY: Found problematic data that needs to be cleaned before migration ***');
  }
  
  await client.end();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
