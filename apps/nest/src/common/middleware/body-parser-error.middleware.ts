import type { NextFunction, Request, Response } from 'express';

export function bodyParserErrorMiddleware(
  err: Error & { type?: string; status?: number; statusCode?: number },
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (!err) return next();

  const isTooLarge =
    err.type === 'entity.too.large' ||
    err.status === 413 ||
    err.statusCode === 413 ||
    err.message?.includes('too large') ||
    err.message?.includes('limit') ||
    err.message?.includes('request entity too large');

  if (isTooLarge) {
    return res.status(413).json({ success: false, message: 'Ukuran request terlalu besar' });
  }

  const isJsonError =
    err instanceof SyntaxError ||
    err.type === 'entity.parse.failed' ||
    err.message?.includes('Unexpected token') ||
    err.message?.includes('JSON');

  if (isJsonError) {
    return res.status(400).json({ success: false, message: 'Format JSON tidak valid' });
  }

  return next(err);
}
