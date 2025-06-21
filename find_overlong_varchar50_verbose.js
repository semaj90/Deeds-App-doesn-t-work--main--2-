// find_overlong_varchar50_verbose.js
// Scans all schemas/tables/columns with varchar(50) for values exceeding 50 characters in Postgres, prints SQL and results

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

  // Find all varchar(50) columns in all schemas
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
    const sql = `SELECT *, LENGTH("${column_name}") as len FROM ${fullTable} WHERE LENGTH("${column_name}") > 50`;
    console.log(`Checking: ${sql}`);
    try {
      const res = await client.query(sql);
      if (res.rows.length > 0) {
        found = true;
        console.log(`\nTable: ${fullTable}, Column: ${column_name}`);
        res.rows.forEach(r => {
          console.log(r);
        });
      }
    } catch (e) {
      console.error(`Error querying ${fullTable}.${column_name}:`, e.message);
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
