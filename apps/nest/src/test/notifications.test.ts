import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NotificationsModule } from '../modules/notifications/notifications.module.js';
import { createFakeDb, createModuleApp } from './helpers/create-module-app.js';

const ID = '123e4567-e89b-12d3-a456-426614174000';
const row = {
    id: ID,
    userId: 'user-123',
    title: 'Judul',
    message: 'Isi',
    type: 'INFO',
    isRead: false,
    targetUrl: null,
    createdAt: new Date('2026-01-02T03:04:05.000Z'),
};

describe('NotificationsModule', () => {
    const db = createFakeDb([row]);
    let app: NestExpressApplication;

    beforeAll(async () => {
        app = await createModuleApp([NotificationsModule], db);
    });
    afterAll(async () => {
        await app.close();
    });

    it('GET /notifications - 401 tanpa X-User-Id', async () => {
        const res = await request(app.getHttpServer()).get('/notifications');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ success: false, message: 'Header X-User-Id wajib diisi' });
    });

    it('GET /notifications - array polos sesuai NotificationDto sumber', async () => {
        const res = await request(app.getHttpServer())
            .get('/notifications?limit=5')
            .set('X-User-Id', 'user-123');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            {
                id: ID,
                title: 'Judul',
                message: 'Isi',
                type: 'INFO',
                isRead: false,
                targetUrl: null,
                createdAt: '2026-01-02T03:04:05.000Z',
            },
        ]);
        expect(db.builder.limit).toHaveBeenCalledWith(5);
    });

    it.each(['0', '101', 'abc'])('GET /notifications?limit=%s - 400', async (limit) => {
        const res = await request(app.getHttpServer())
            .get(`/notifications?limit=${limit}`)
            .set('X-User-Id', 'user-123');
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('PUT /notifications/:id/read - 204', async () => {
        const res = await request(app.getHttpServer())
            .put(`/notifications/${ID}/read`)
            .set('X-User-Id', 'user-123');
        expect(res.status).toBe(204);
    });

    it('PUT /notifications/:id/read - 404 bila bukan milik pengguna / tidak ada', async () => {
        const kosong = createFakeDb([]);
        const app2 = await createModuleApp([NotificationsModule], kosong);
        const res = await request(app2.getHttpServer())
            .put(`/notifications/${ID}/read`)
            .set('X-User-Id', 'user-123');
        expect(res.status).toBe(404);
        await app2.close();
    });

    it('PUT /notifications/bukan-guid/read - 404 (setara {id:guid})', async () => {
        const res = await request(app.getHttpServer())
            .put('/notifications/bukan-guid/read')
            .set('X-User-Id', 'user-123');
        expect(res.status).toBe(404);
    });

    it('PUT /notifications/read-all - 204', async () => {
        const res = await request(app.getHttpServer())
            .put('/notifications/read-all')
            .set('X-User-Id', 'user-123');
        expect(res.status).toBe(204);
    });
});
