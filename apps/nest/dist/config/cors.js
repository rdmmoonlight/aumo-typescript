import { env } from '../lib/env.js';
function clean(origin) {
    return origin.trim().replace(/\/$/, '');
}
export function resolveAllowedOrigins() {
    const raw = env.CORS_ORIGINS ?? env.FRONTEND_URL ?? 'http://localhost:3000';
    const configured = raw.split(',').map(clean).filter(Boolean);
    const defaults = ['http://localhost:3000', 'https://aumoweb.onrender.com'];
    return Array.from(new Set([...configured, ...defaults].map(clean)));
}
export function createCorsOptions() {
    const allowedOrigins = resolveAllowedOrigins();
    return {
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            const cleanOrigin = clean(origin);
            if (allowedOrigins.includes(cleanOrigin))
                return callback(null, cleanOrigin);
            if (env.NODE_ENV !== 'production' &&
                (cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1'))) {
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
//# sourceMappingURL=cors.js.map