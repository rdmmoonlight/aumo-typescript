import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as testAppHelpers from './helpers/create-test-app.test.js';

describe('Health Routes', () => {
  let app: NestExpressApplication | undefined;

  beforeAll(async () => {
    // Menangani kompatibilitas named export maupun default export
    type CreateTestApp = () => Promise<NestExpressApplication>;
    const helpers = testAppHelpers as unknown as {
      createTestApp?: CreateTestApp;
      default?: CreateTestApp;
    };
    const createTestAppFn =
      helpers.createTestApp ?? helpers.default;

    if (typeof createTestAppFn !== 'function') {
      throw new TypeError(
        'createTestApp is not exported as a function from ./helpers/create-test-app.test.js'
      );
    }

    app = await createTestAppFn();
  });

  afterAll(async () => {
    // Optional chaining mencegah crash 'Cannot read properties of undefined (reading close)'
    await app?.close();
  });

  it('GET / - status 200 dan pesan server online', async () => {
    if (!app) throw new Error('App was not initialized');

    const res = await request(app.getHttpServer()).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', message: 'Aumo API Server Online 🚀' });
  });

  it('HEAD / - status 200 dengan body kosong (ping)', async () => {
    if (!app) throw new Error('App was not initialized');

    const res = await request(app.getHttpServer()).head('/');

    expect(res.status).toBe(200);
    expect(res.text ?? '').toBe('');
  });

  it('GET /health - status 200 dan timestamp valid', async () => {
    if (!app) throw new Error('App was not initialized');

    const res = await request(app.getHttpServer()).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pass');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });
});