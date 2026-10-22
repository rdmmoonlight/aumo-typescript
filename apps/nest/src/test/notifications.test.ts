import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module.js';

describe('NotificationsModule (E2E)', () => {
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

    it('GET /notifications - Tanpa X-User-Id (Harus Error 401)', async () => {
        const res = await request(app.getHttpServer()).get('/notifications');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
            success: false,
            message: 'Header X-User-Id wajib diisi',
        });
    });

    it('GET /notifications - Dengan X-User-Id Valid', async () => {
        const res = await request(app.getHttpServer())
            .get('/notifications')
            .set('X-User-Id', 'user-123');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('PATCH /notifications/:id/read - Tandai Satu Dibaca', async () => {
        const res = await request(app.getHttpServer())
            .patch('/notifications/123e4567-e89b-12d3-a456-426614174000/read')
            .set('X-User-Id', 'user-123');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('PATCH /notifications/read-all - Tandai Semua Dibaca', async () => {
        const res = await request(app.getHttpServer())
            .patch('/notifications/read-all')
            .set('X-User-Id', 'user-123');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});