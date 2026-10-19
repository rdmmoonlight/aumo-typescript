import type { NextFunction, Request, Response } from 'express';
import { logger } from '../../lib/logger.js';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = performance.now();
  const method = req.method;
  const path = req.originalUrl.split('?')[0];
  const requestId = res.locals.requestId as string | undefined;

  logger.info({ requestId, method, path }, `--> [IN] ${method} ${path}`);

  res.on('finish', () => {
    const status = res.statusCode;
    const ms = Math.round(performance.now() - start);
    const data = { requestId, method, path, status, ms };
    const message = `<-- [OUT] ${method} ${path} ${status} (${ms}ms)`;

    if (status >= 500) logger.error(data, message);
    else if (status >= 400) logger.warn(data, message);
    else logger.info(data, message);
  });

  next();
}
