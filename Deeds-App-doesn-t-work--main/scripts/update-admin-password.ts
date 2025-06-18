import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function updateAdminPassword() {
  const email = 'admin@example.com';
  const newPassword = 'password123'; // The password you want to set
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    const result = await db.update(users)
      .set({ hashedPassword: hashedPassword })
      .where(eq(users.email, email))
      .returning({ id: users.id, email: users.email });

    if (result.length > 0) {
      console.log(`Successfully updated password for user: ${result[0].email}`);
    } else {
      console.log(`User with email ${email} not found.`);
    }
  } catch (error) {
    console.error(`Error updating password for user: ${email}`, error);
  } finally {
    // Close connection if necessary
  }
}

updateAdminPassword().catch((e) => {
  console.error('Failed to update admin password:', e);
  process.exit(1);
});