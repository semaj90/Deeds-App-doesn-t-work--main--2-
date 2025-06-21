const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/prosecutor_db'
  });
  await client.connect();
  // Find all varchar(50) columns in all tables
  const columnsRes = await client.query(`
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE data_type = 'character varying' AND character_maximum_length = 50
      AND table_schema NOT IN ('information_schema', 'pg_catalog')
  `);
  for (const row of columnsRes.rows) {
    const { table_schema, table_name, column_name } = row;
    const fullTable = `"${table_schema}"."${table_name}"`;
    const query = `SELECT * FROM ${fullTable} WHERE LENGTH("${column_name}") > 50`;
    const res = await client.query(query);
    if (res.rows.length > 0) {
      console.log(`Table: ${fullTable}, Column: ${column_name}`);
      res.rows.forEach(r => {
        console.log(r);
      });
    }
  }
  await client.end();
}

main();
