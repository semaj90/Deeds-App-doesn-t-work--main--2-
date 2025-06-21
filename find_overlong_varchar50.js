// find_overlong_varchar50.js
// Scans all tables/columns with varchar(50) for values exceeding 50 characters in Postgres

const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prosecutor_db';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  // Find all varchar(50) columns
  const columnsRes = await client.query(`
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE data_type = 'character varying'
      AND character_maximum_length = 50
      AND table_schema NOT IN ('information_schema', 'pg_catalog')
    ORDER BY table_schema, table_name;
  `);

  let found = false;
  for (const row of columnsRes.rows) {
    const { table_schema, table_name, column_name } = row;
    const fullTable = `"${table_schema}"."${table_name}"`;
    const sql = `SELECT * FROM ${fullTable} WHERE LENGTH("${column_name}") > 50`;
    const res = await client.query(sql);
    if (res.rows.length > 0) {
      found = true;
      console.log(`\nTable: ${fullTable}, Column: ${column_name}`);
      res.rows.forEach(r => {
        console.log(r);
      });
    }
  }
  if (!found) {
    console.log('No overlong values found in any varchar(50) columns.');
  }
  await client.end();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
