import { toNodeHandler } from 'better-auth/node';
import helmet from 'helmet';
import { bodyParserErrorMiddleware } from './common/middleware/body-parser-error.middleware.js';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { requestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { createCorsOptions } from './config/cors.js';
import { auth } from './lib/auth.js';
import { env } from './lib/env.js';
export function configureApp(app) {
    app.use(requestIdMiddleware);
    app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.enableCors(createCorsOptions());
    app.use(requestLoggerMiddleware);
    const CUSTOM_AUTH_ROUTES = [
        '/auth/check-email',
        '/auth/register',
        '/auth/login',
        '/auth/logout',
        '/auth/me',
        '/auth/change-password',
        '/auth/sessions',
    ];
    app
        .getHttpAdapter()
        .getInstance()
        .use('/auth', (req, res, next) => {
        const p = (req.originalUrl || req.url || req.path || '');
        const clean = p.split('?')[0];
        const isCustom = CUSTOM_AUTH_ROUTES.some((r) => clean === r || clean.startsWith(r + '/'));
        if (isCustom)
            return next();
        return toNodeHandler(auth)(req, res);
    });
    app.useBodyParser('json', {
        limit: env.BODY_LIMIT_BYTES,
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    });
    app.useBodyParser('urlencoded', { limit: env.BODY_LIMIT_BYTES, extended: true });
    app.use(bodyParserErrorMiddleware);
}
//# sourceMappingURL=app.setup.js.map