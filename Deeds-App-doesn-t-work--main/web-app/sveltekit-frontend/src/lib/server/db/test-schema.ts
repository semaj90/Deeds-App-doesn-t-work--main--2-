import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { resolve } from 'path';

const databasePath = resolve('../../dev.db');
const sqlite = new Database(databasePath);
const db = drizzle(sqlite, { schema });

async function testSchema() {
  console.log('Testing database schema...');
  
  // Test users table
  const users = await db.query.users.findMany();
  console.log(`Found ${users.length} users:`, users.map(u => ({ id: u.id, name: u.name, email: u.email })));
  
  // Test if all advanced tables exist by trying to query them
  const tables = [
    'users', 'cases', 'evidence', 'statutes', 'case_events', 'case_relationships',
    'saved_statements', 'case_text_fragments', 'nlp_analysis_cache', 'user_preferences',
    'case_templates', 'case_activities', 'crimes', 'criminals'
  ];
  
  for (const table of tables) {
    try {
      const query = `SELECT COUNT(*) as count FROM ${table}`;
      const result = sqlite.prepare(query).get() as { count: number };
      console.log(`✅ Table '${table}': ${result.count} records`);
    } catch (error) {
      console.log(`❌ Table '${table}': ERROR - ${error}`);
    }
  }
  
  console.log('Schema test completed!');
}

testSchema().catch(console.error);
