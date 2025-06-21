import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { users, sessions } from './db/shared-db';

export const lucia = new Lucia(new DrizzlePostgreSQLAdapter(db, sessions, users), {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (user: any) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    provider: user.provider,
  }),
});

export type Auth = typeof lucia;
