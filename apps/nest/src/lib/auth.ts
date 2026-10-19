import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { resolveAllowedOrigins } from '../config/cors.js';
import * as schema from '../db/schema/index.js';
import { db } from './db.js';
import { env } from './env.js';
import { logger } from './logger.js';

let auth: ReturnType<typeof betterAuth>;

// Frontend dan backend beda situs (mis. *.onrender.com) -> cookie sesi wajib SameSite=None; Secure,
// kalau tidak browser tidak mengirim cookie pada request lintas situs (hasilnya 401 setelah login).
const crossSiteCookies =
  env.NODE_ENV === 'production' || !!env.BETTER_AUTH_URL?.startsWith('https://');

try {
  const adapter = drizzleAdapter(db as any, {
    provider: 'pg',
    schema: schema as any,
  });

  auth = betterAuth({
    database: adapter,
    secret: env.BETTER_AUTH_SECRET ?? env.JWT_SIGNING_KEY,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true },
    // Sama dengan allowlist CORS (CORS_ORIGINS / FRONTEND_URL + default)
    trustedOrigins: resolveAllowedOrigins(),
    advanced: {
      defaultCookieAttributes: {
        sameSite: crossSiteCookies ? 'none' : 'lax',
        secure: crossSiteCookies,
        httpOnly: true,
      },
    },
  } as BetterAuthOptions);
} catch (e: any) {
  logger.error({ err: e }, 'Failed to initialize Better Auth');
  throw e;
}

export { auth };
