const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/prosecutor_db'
  });
  await client.connect();
  try {
    await client.query('ALTER TABLE "law_paragraphs" ALTER COLUMN "anchor_id" SET DATA TYPE uuid USING "anchor_id"::uuid;');
    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

main();
