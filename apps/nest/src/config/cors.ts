import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';
import { env } from '../lib/env.js';

function clean(origin: string): string {
  return origin.trim().replace(/\/$/, '');
}

export function resolveAllowedOrigins(): string[] {
  const raw = env.CORS_ORIGINS ?? env.FRONTEND_URL ?? 'http://localhost:3000';

  const configured = raw.split(',').map(clean).filter(Boolean);

  // Pastikan SEMUA URL bersih dari trailing slash
  const defaults = ['http://localhost:3000', 'https://aumoweb.onrender.com'];

  return Array.from(new Set([...configured, ...defaults].map(clean)));
}

export function createCorsOptions(): CorsOptions {
  const allowedOrigins = resolveAllowedOrigins();

  return {
    origin: (origin, callback) => {
      // Non-browser client (Postman/cURL/mobile) tidak mengirim Origin
      if (!origin) return callback(null, true);

      const cleanOrigin = clean(origin);
      if (allowedOrigins.includes(cleanOrigin)) return callback(null, cleanOrigin);

      // Mode development: izinkan semua origin localhost/127.0.0.1
      if (
        env.NODE_ENV !== 'production' &&
        (cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1'))
      ) {
        return callback(null, cleanOrigin);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86_400,
  };
}
