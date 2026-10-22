import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HealthModule } from '../modules/health/health.module.js';
import { createFakeDb, createModuleApp } from './helpers/create-module-app.js';

describe('HealthModule', () => {
    const db = createFakeDb();
    let app: NestExpressApplication;

    beforeAll(async () => {
        app = await createModuleApp([HealthModule], db);
    });
    afterAll(async () => {
        await app.close();
    });

    it('GET / - publik, status 200', async () => {
        const res = await request(app.getHttpServer()).get('/');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok', message: 'Aumo API Server Online 🚀' });
    });

    it('GET /health - bentuk respons sama dengan HealthController sumber', async () => {
        const res = await request(app.getHttpServer()).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('online');
        expect(res.body.database).toBe('connected');
        expect(res.body).toHaveProperty('commit');
        expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
    });

    it('GET /health - 503 saat database gagal', async () => {
        db.execute.mockRejectedValueOnce(new Error('koneksi putus'));
        const res = await request(app.getHttpServer()).get('/health');
        expect(res.status).toBe(503);
        expect(res.body).toMatchObject({
            status: 'offline',
            database: 'error',
            message: 'koneksi putus',
        });
    });
});
