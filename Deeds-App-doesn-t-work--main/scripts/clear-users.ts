import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';

async function clearUsers() {
  try {
    console.log('Clearing users table...');
    await db.delete(users);
    console.log('Users table cleared.');
  } catch (error) {
    console.error('Error clearing users table:', error);
  } finally {
    process.exit(0);
  }
}

clearUsers().catch(console.error);