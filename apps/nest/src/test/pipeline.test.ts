import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '../lib/auth.js';
import { redis } from '../lib/redis.js';
import { createTestApp } from './helpers/create-test-app.test.js';

describe('Middleware pipeline', () => {
  let app: NestExpressApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp({ getSession: vi.fn().mockResolvedValue(null) } as never);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    const chain = vi.mocked(redis.pipeline)();
    vi.mocked(chain.exec).mockResolvedValue([
      [null, 1],
      [null, 60_000],
    ]);
  });

  it('menambahkan X-Request-Id dan memakai ulang ID valid dari client', async () => {
    const generated = await http().get('/health');
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

    const reused = await http().get('/health').set('X-Request-Id', 'abc-123');
    expect(reused.headers['x-request-id']).toBe('abc-123');
  });

  it('memasang header keamanan (helmet)', async () => {
    const res = await http().get('/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  describe('CORS', () => {
    it('mengizinkan origin terdaftar dengan credentials', async () => {
      const res = await http()
        .options('/auth/login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('tidak memberi izin pada origin asing', async () => {
      const res = await http().get('/health').set('Origin', 'https://jahat.example.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Rate limit', () => {
    it('mengirim header RateLimit-*', async () => {
      const res = await http().get('/health');

      expect(res.headers['ratelimit-limit']).toBe('100');
      expect(res.headers['ratelimit-remaining']).toBe('99');
    });

    it('429 jika melewati batas global', async () => {
      const chain = vi.mocked(redis.pipeline)();
      vi.mocked(chain.exec).mockResolvedValue([
        [null, 101],
        [null, 30_000],
      ]);

      const res = await http().get('/health');

      expect(res.status).toBe(429);
      expect(res.headers['retry-after']).toBe('30');
      expect(res.body).toEqual({
        success: false,
        message: 'Terlalu banyak request, coba lagi nanti',
      });
    });

    it('fail-open jika Redis error', async () => {
      const chain = vi.mocked(redis.pipeline)();
      vi.mocked(chain.exec).mockRejectedValue(new Error('redis down'));

      const res = await http().get('/health');

      expect(res.status).toBe(200);
    });

    it('fail-open jika Redis menggantung (timeout)', async () => {
      const chain = vi.mocked(redis.pipeline)();
      vi.mocked(chain.exec).mockReturnValue(new Promise(() => { }));

      const res = await http().get('/health');

      expect(res.status).toBe(200);
    }, 5000);

    it('memasang expire pada key baru', async () => {
      const chain = vi.mocked(redis.pipeline)();
      vi.mocked(chain.exec).mockResolvedValue([
        [null, 1],
        [null, -1],
      ]);

      await http().get('/health');

      expect(redis.pexpire).toHaveBeenCalledWith(
        expect.stringContaining('ratelimit:global:'),
        60_000
      );
    });

    it('endpoint auth memakai counter terpisah (scope auth)', async () => {
      await http().post('/auth/login').send({ email: 'a@b.com', password: 'x' });

      const incr = vi.mocked(vi.mocked(redis.pipeline)().incr);
      const keys = incr.mock.calls.map((c) => String(c[0]));
      expect(keys.some((k) => k.startsWith('ratelimit:auth:'))).toBe(true);
    });
  });

  describe('Body & error handling', () => {
    it('413 jika body melebihi BODY_LIMIT_BYTES', async () => {
      const res = await http()
        .post('/auth/login')
        .send({ email: 'a@b.com', password: 'x'.repeat(2048) });

      expect(res.status).toBe(413);
      expect(res.body).toEqual({ success: false, message: 'Ukuran request terlalu besar' });
    });

    it('400 jika JSON rusak', async () => {
      const res = await http()
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('{rusak');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ success: false, message: 'Format JSON tidak valid' });
    });

    it('404 berformat konsisten untuk route yang tidak ada', async () => {
      const res = await http().get('/tidak-ada');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: 'Route tidak ditemukan' });
    });
  });

  describe('Better Auth bawaan', () => {
    it('/auth/* diteruskan ke handler Better Auth', async () => {
      const res = await http().get('/auth/ok');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ handledBy: 'better-auth', path: '/auth/ok' });
      expect(auth.handler).toHaveBeenCalled();
    });
  });

  describe('OpenAPI', () => {
    it('dokumen Swagger dapat dibuat dan memuat seluruh route auth + health', () => {
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('t').build()
      );

      expect(Object.keys(document.paths)).toEqual(
        expect.arrayContaining([
          '/',
          '/health',
          '/auth/register',
          '/auth/login',
          '/auth/logout',
          '/auth/me',
          '/auth/check-email',
          '/auth/change-password',
          '/auth/sessions',
          '/auth/sessions/{id}',
        ])
      );
    });
  });
});
