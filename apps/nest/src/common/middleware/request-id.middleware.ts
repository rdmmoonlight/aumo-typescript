import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
const VALID_REQUEST_ID = /^[\w=-]{1,255}$/;

/** ID unik per request (header X-Request-Id). ID dari client dipakai ulang jika formatnya valid. */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id =
    typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();

  res.locals.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
