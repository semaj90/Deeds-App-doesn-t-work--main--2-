import { db } from '../server/db';
import { users } from '../server/db/schema-postgres';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function offlineLogin(email: string, password: string) {
  // This would use Tauri secure storage or IndexedDB in a real app
  // For demo, just check local DB
  const found = await db.select().from(users).where(eq(users.email, email));
  const user = found[0];
  if (!user || !user.hashedPassword) return null;
  const valid = await bcrypt.compare(password, user.hashedPassword);
  if (!valid) return null;
  return user;
}
