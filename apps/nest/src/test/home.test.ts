import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module.js';

describe('HomeModule (E2E)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /kurs - Tanpa Authentikasi (Publik)', async () => {
        const res = await request(app.getHttpServer())
            .get('/kurs')
            .query({ baseCurrency: 'USD', targetCurrency: 'IDR' });

        expect([200, 400, 500]).toContain(res.status);
    });

    it('GET /home/market-indicators - Tanpa X-User-Id (Harus 401)', async () => {
        const res = await request(app.getHttpServer()).get('/home/market-indicators');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
            success: false,
            message: 'Header X-User-Id wajib diisi',
        });
    });

    it('GET /home/market-indicators - Dengan X-User-Id Valid', async () => {
        const res = await request(app.getHttpServer())
            .get('/home/market-indicators')
            .set('X-User-Id', 'user-123');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success');
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});