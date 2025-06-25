import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';

const isProd = process.env.NODE_ENV === 'production';

export const lucia = new Lucia(
  new DrizzlePostgreSQLAdapter(db as any, sessions as any, users as any),
  {
    sessionCookie: {
      attributes: {
        secure: isProd, // Secure cookies in production, not in dev
        sameSite: 'lax',
        path: '/',
      }
    },
    getUserAttributes: (user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      profile: user.profile
    })
  }
);

export type Auth = typeof lucia;
