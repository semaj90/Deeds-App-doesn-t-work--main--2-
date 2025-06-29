const { Client } = require('pg');

const columnsToCheck = [
  { table: 'crimes', column: 'name', max: 50 },
  { table: 'crimes', column: 'charge_level', max: 50 },
  { table: 'crimes', column: 'status', max: 50 },
  { table: 'law_paragraphs', column: 'paragraph_number', max: 50 },
  { table: 'statutes', column: 'code', max: 50 },
  { table: 'statutes', column: 'severity', max: 20 },
  { table: 'users', column: 'role', max: 50 },
  { table: 'users', column: 'first_name', max: 100 },
  { table: 'users', column: 'last_name', max: 100 },
  { table: 'users', column: 'title', max: 100 },
  { table: 'users', column: 'department', max: 200 },
  { table: 'users', column: 'phone', max: 20 },
  { table: 'users', column: 'avatar', max: null },
  { table: 'users', column: 'bio', max: null }
];

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/prosecutor_db'
  });
  await client.connect();
  for (const { table, column, max } of columnsToCheck) {
    if (!max) continue;
    const res = await client.query(`SELECT id, "${column}" FROM "${table}" WHERE LENGTH("${column}") > $1`, [max]);
    if (res.rows.length > 0) {
      console.log(`Table: ${table}, Column: ${column}, Max: ${max}`);
      res.rows.forEach(row => {
        console.log(`  id: ${row.id}, value: ${row[column]}`);
      });
    }
  }
  await client.end();
}

main();
