import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { users, sessions } from './db/schema';
import type { InferSelectModel } from 'drizzle-orm';

// Type assertion to make the adapter compatible
export const lucia = new Lucia(new DrizzlePostgreSQLAdapter(db as any, sessions as any, users as any), {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production'
    }
  },
  getUserAttributes: (user: InferSelectModel<typeof users>) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role,
    avatar: user.avatar,
    provider: user.provider,
    image: user.image,
  }),
});

export type Auth = typeof lucia;

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: InferSelectModel<typeof users>;
  }
}
