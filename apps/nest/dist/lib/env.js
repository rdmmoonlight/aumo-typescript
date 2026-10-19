import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string().url('DATABASE_URL harus berupa URL yang valid'),
    REDIS_URL: z.string().url('REDIS_URL harus berupa URL yang valid').optional(),
    JWT_SIGNING_KEY: z.string().min(32, 'JWT_SIGNING_KEY minimal 32 karakter demi keamanan'),
    JWT_ISSUER: z.string().min(2, 'JWT_ISSUER minimal 2 karakter').default('nest'),
    BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET minimal 32 karakter').optional(),
    BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL harus berupa URL yang valid').optional(),
    FRONTEND_URL: z.string().url('FRONTEND_URL harus berupa URL yang valid').optional(),
    CORS_ORIGINS: z.string().optional(),
    BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(1_048_576),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
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
//# sourceMappingURL=env.js.map