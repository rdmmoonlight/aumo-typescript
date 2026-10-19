import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import helmet from 'helmet';
import { bodyParserErrorMiddleware } from './common/middleware/body-parser-error.middleware.js';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { requestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { createCorsOptions } from './config/cors.js';
import { env } from './lib/env.js';

export function configureApp(app: NestExpressApplication): void {
  app.use(requestIdMiddleware);
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } })
  );
  app.enableCors(createCorsOptions());
  app.use(requestLoggerMiddleware);

  app
    .getHttpAdapter()
    .getInstance()
    ;

  app.useBodyParser('json', {
    limit: env.BODY_LIMIT_BYTES,
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as Request & { rawBody?: Buffer }).rawBody = buf;
    },
  });
  app.useBodyParser('urlencoded', { limit: env.BODY_LIMIT_BYTES, extended: true });

  app.use(bodyParserErrorMiddleware);
}
