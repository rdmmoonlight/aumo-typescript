import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  // Database & Cache
  DATABASE_URL: z.string().url('DATABASE_URL harus berupa URL yang valid'),
  REDIS_URL: z.string().url('REDIS_URL harus berupa URL yang valid').optional(),

  // HTTP pipeline (CORS, body limit, rate limit)
  FRONTEND_URL: z.string().url('FRONTEND_URL harus berupa URL yang valid').optional(),
  CORS_ORIGINS: z.string().optional(), // daftar origin dipisah koma
  BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(1_048_576), // 1 MB,
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Environment variables tidak valid:');
    console.error(JSON.stringify(z.treeifyError(parsed.error), null, 2));

    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }

    throw new Error('Environment variables validation failed');
  }

  return parsed.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;

// TODO: ensure 413 handler returns {success:false, message:'Ukuran request terlalu besar'}
