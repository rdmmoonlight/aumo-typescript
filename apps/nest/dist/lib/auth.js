import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { resolveAllowedOrigins } from '../config/cors.js';
import * as schema from '../db/schema/index.js';
import { db } from './db.js';
import { env } from './env.js';
import { logger } from './logger.js';
let auth;
const crossSiteCookies = env.NODE_ENV === 'production' || !!env.BETTER_AUTH_URL?.startsWith('https://');
try {
    if (!db) {
        throw new Error('Database connection is not initialized');
    }
    const adapter = drizzleAdapter(db, {
        provider: 'pg',
        schema,
    });
    auth = betterAuth({
        database: adapter,
        secret: env.BETTER_AUTH_SECRET ?? env.JWT_SIGNING_KEY,
        baseURL: env.BETTER_AUTH_URL,
        emailAndPassword: { enabled: true },
        trustedOrigins: resolveAllowedOrigins(),
        advanced: {
            defaultCookieAttributes: {
                sameSite: crossSiteCookies ? 'none' : 'lax',
                secure: crossSiteCookies,
                httpOnly: true,
            },
        },
    });
}
catch (e) {
    logger.error({ err: e }, 'Failed to initialize Better Auth');
    throw e;
}
export { auth };
//# sourceMappingURL=auth.js.map