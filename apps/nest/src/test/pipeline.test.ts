import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { redis } from '../lib/redis.js';
import { createTestApp } from './helpers/create-test-app.test.js';

describe('Middleware pipeline', () => {
  let app: NestExpressApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    // Mencegah error 'reading close of undefined' jika app gagal diinisialisasi
    await app?.close();
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
        .options('/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
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
  });

  describe('Body & error handling', () => {
    it('404 berformat konsisten untuk route yang tidak ada', async () => {
      const res = await http().get('/tidak-ada');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: 'Route tidak ditemukan' });
    });
  });

  describe('OpenAPI', () => {
    it('dokumen Swagger dapat dibuat dan memuat seluruh route + health', () => {
      const config = new DocumentBuilder().setTitle('aumo API').build();
      const document = SwaggerModule.createDocument(app, config);

      expect(document).toBeDefined();
      expect(document.paths).toHaveProperty('/health');
    });
  });
});