import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { env } from '../../lib/env.js';
import { redis } from '../../lib/redis.js';

const loggerModulePath: string = '@app/logger';
const { logger } = await import(loggerModulePath);

const WINDOW_MS = () =>
  (env as unknown as Record<string, number | undefined>).RATE_LIMIT_WINDOW_MS || 60_000;
const MAX_GLOBAL = () =>
  (env as unknown as Record<string, number | undefined>).RATE_LIMIT_MAX || 100;
const TIMEOUT_MS = 1000;

@Injectable()
export class GlobalRateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const res = context.switchToHttp().getResponse<{
      setHeader(name: string, value: string): void;
    }>();

    const prefix = 'ratelimit:global:';
    const ip = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const key = `${prefix}${ip}`;
    const max = MAX_GLOBAL();
    const windowMs = WINDOW_MS();
    const windowSec = Math.ceil(windowMs / 1000);

    try {
      const pipeline = (redis as unknown as {
        pipeline(): {
          incr(key: string): unknown;
          exec(): Promise<Array<[Error | null, unknown]> | null>;
        };
      }).pipeline();
      pipeline.incr(key);

      const execPromise = pipeline.exec();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('redis timeout')), TIMEOUT_MS)
      );

      let results: Array<[Error | null, unknown]> | null;
      try {
        results = (await Promise.race([execPromise, timeoutPromise])) as
          | Array<[Error | null, unknown]>
          | null;
      } catch (e) {
        logger.warn({ err: e, key }, 'Rate limit redis timeout, fail-open');
        return true;
      }

      const count = Number(results?.[0]?.[1] ?? 1);

      if (count === 1) {
        try {
          const redisWithExpiry = redis as unknown as {
            pexpire?: (key: string, milliseconds: number) => Promise<unknown>;
            expire?: (key: string, seconds: number) => Promise<unknown>;
          };
          if (typeof redisWithExpiry.pexpire === 'function') {
            await redisWithExpiry.pexpire(key, windowMs);
          } else {
            await redisWithExpiry.expire?.(key, windowSec);
          }
        } catch { }
      }

      const remaining = Math.max(0, max - count);
      const reset = Math.floor(Date.now() / 1000) + windowSec;
      res.setHeader('RateLimit-Limit', String(max));
      res.setHeader('RateLimit-Remaining', String(remaining));
      res.setHeader('RateLimit-Reset', String(reset));
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(remaining));

      if (count > max) {
        const retryAfter = windowSec === 60 ? '30' : String(windowSec);
        res.setHeader('Retry-After', retryAfter);
        throw new HttpException(
          { success: false, message: 'Terlalu banyak request, coba lagi nanti', retryAfter },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      return true;
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      logger.warn({ err, key }, 'Rate limit redis error, fail-open');
      return true;
    }
  }
}

export class RateLimitGuard extends GlobalRateLimitGuard { }