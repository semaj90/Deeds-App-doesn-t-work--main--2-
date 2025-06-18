import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  AUTH_SECRET: z.string().min(32),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ORIGIN: z.string().url().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./static/uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).default('52428800'),
  ENABLE_REGISTRATION: z.string().transform(Boolean).default('true'),
  REQUIRE_EMAIL_VERIFICATION: z.string().transform(Boolean).default('false'),
  DEFAULT_USER_ROLE: z.string().default('prosecutor'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('900000'),
  JWT_EXPIRATION_SECONDS: z.string().transform(Number).default('604800'), // 7 days in seconds
});

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment configuration');
  }
}

export const env = validateEnv();