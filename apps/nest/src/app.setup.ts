import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { bodyParserErrorMiddleware } from './common/middleware/body-parser-error.middleware.js';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { requestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { createCorsOptions } from './config/cors.js';
import { auth } from './lib/auth.js';
import { env } from './lib/env.js';

export function configureApp(app: NestExpressApplication): void {
  app.use(requestIdMiddleware);
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } })
  );
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
    .use('/auth', (req: Request, res: Response, next: NextFunction) => {
      const p = (req.originalUrl || req.url || req.path || '') as string;
      const clean = p.split('?')[0];
      const isCustom = CUSTOM_AUTH_ROUTES.some((r) => clean === r || clean.startsWith(r + '/'));
      if (isCustom) return next();
      return toNodeHandler(auth)(req, res);
    });

  app.useBodyParser('json', {
    limit: env.BODY_LIMIT_BYTES,
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as Request & { rawBody?: Buffer }).rawBody = buf;
    },
  });
  app.useBodyParser('urlencoded', { limit: env.BODY_LIMIT_BYTES, extended: true });

  app.use(bodyParserErrorMiddleware);
}
