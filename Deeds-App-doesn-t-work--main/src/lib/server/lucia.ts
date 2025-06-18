import { Lucia } from 'lucia';
import { DrizzleAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { users, sessions } from './db/schema';

export const lucia = new Lucia(new DrizzleAdapter(db, users, sessions), {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    provider: user.provider,
  }),
});

export type Auth = typeof lucia;
