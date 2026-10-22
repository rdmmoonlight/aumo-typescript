import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module.js';

describe('ExampleModule (E2E)', () => {
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

    it('GET /examples/public-info - Tanpa X-User-Id (Harus Lolos)', async () => {
        const res = await request(app.getHttpServer()).get('/examples/public-info');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                message: 'Informasi publik berhasil diambil',
            }),
        );
    });

    it('GET /examples - Tanpa X-User-Id (Harus Error 401)', async () => {
        const res = await request(app.getHttpServer()).get('/examples');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
            success: false,
            message: 'Header X-User-Id wajib diisi',
        });
    });

    it('GET /examples - Dengan X-User-Id Valid', async () => {
        const res = await request(app.getHttpServer())
            .get('/examples')
            .set('X-User-Id', 'user-123');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});