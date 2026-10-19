var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpException, HttpStatus, Injectable, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { env } from '../../lib/env.js';
import { logger } from '../../lib/logger.js';
import { redis } from '../../lib/redis.js';
const WINDOW_MS = () => env.RATE_LIMIT_WINDOW_MS || 60_000;
const MAX_GLOBAL = () => env.RATE_LIMIT_MAX || 100;
const MAX_AUTH = () => env.AUTH_RATE_LIMIT_MAX || 10;
const TIMEOUT_MS = 1000;
let GlobalRateLimitGuard = class GlobalRateLimitGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const path = req.originalUrl || req.url || req.path || '';
        const isAuth = path.startsWith('/auth') || path.includes('/auth/');
        const scope = isAuth ? 'auth' : 'global';
        const prefix = scope === 'auth' ? 'ratelimit:auth:' : 'ratelimit:global:';
        const ip = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
        const key = `${prefix}${ip}`;
        const max = scope === 'auth' ? MAX_AUTH() : MAX_GLOBAL();
        const windowMs = WINDOW_MS();
        const windowSec = Math.ceil(windowMs / 1000);
        try {
            const pipeline = redis.pipeline();
            pipeline.incr(key);
            const execPromise = pipeline.exec();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('redis timeout')), TIMEOUT_MS));
            let results;
            try {
                results = (await Promise.race([execPromise, timeoutPromise]));
            }
            catch (e) {
                logger.warn({ err: e, key }, 'Rate limit redis timeout, fail-open');
                return true;
            }
            const count = Number(results?.[0]?.[1] ?? 1);
            if (count === 1) {
                try {
                    const redisWithExpiry = redis;
                    if (typeof redisWithExpiry.pexpire === 'function') {
                        await redisWithExpiry.pexpire(key, windowMs);
                    }
                    else {
                        await redisWithExpiry.expire?.(key, windowSec);
                    }
                }
                catch { }
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
                throw new HttpException({ success: false, message: 'Terlalu banyak request, coba lagi nanti', retryAfter }, HttpStatus.TOO_MANY_REQUESTS);
            }
            return true;
        }
        catch (err) {
            if (err instanceof HttpException)
                throw err;
            logger.warn({ err, key }, 'Rate limit redis error, fail-open');
            return true;
        }
    }
};
GlobalRateLimitGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector])
], GlobalRateLimitGuard);
export { GlobalRateLimitGuard };
let AuthRateLimitGuard = class AuthRateLimitGuard extends GlobalRateLimitGuard {
};
AuthRateLimitGuard = __decorate([
    Injectable()
], AuthRateLimitGuard);
export { AuthRateLimitGuard };
export class RateLimitGuard extends GlobalRateLimitGuard {
}
//# sourceMappingURL=rate-limit.guard.js.map