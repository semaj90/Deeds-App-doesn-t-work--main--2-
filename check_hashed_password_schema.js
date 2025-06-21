const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'prosecutor_db',
  ssl: false,
});

async function checkSchema() {
  await client.connect();
  
  const res = await client.query(`
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'hashed_password'
  `);
  
  console.log('users.hashed_password schema:');
  console.log(res.rows[0]);
  
  await client.end();
}

checkSchema().catch(console.error);
