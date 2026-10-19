import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers/create-test-app.test.js';

describe('Health Routes', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / - status 200 dan pesan server online', async () => {
    const res = await request(app.getHttpServer()).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', message: 'Aumone API Server Online 🚀' });
  });

  it('HEAD / - status 200 dengan body kosong (ping)', async () => {
    const res = await request(app.getHttpServer()).head('/');

    expect(res.status).toBe(200);
    expect(res.text ?? '').toBe('');
  });

  it('GET /health - status 200 dan timestamp valid', async () => {
    const res = await request(app.getHttpServer()).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pass');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });
});
