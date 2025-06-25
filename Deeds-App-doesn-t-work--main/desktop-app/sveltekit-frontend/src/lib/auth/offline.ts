import { db } from '../server/db';
import { users } from '../server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function offlineLogin(email: string, password: string) {
  // This would use Tauri secure storage or IndexedDB in a real app
  // For demo, just check local DB
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !user.hashedPassword) return null;
  const valid = await bcrypt.compare(password, user.hashedPassword);
  if (!valid) return null;
  return user;
}
