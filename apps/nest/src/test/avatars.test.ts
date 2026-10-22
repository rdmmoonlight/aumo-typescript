import type { NestExpressApplication } from '@nestjs/platform-express';
import { Readable } from 'stream';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AvatarsStorageService } from '../modules/avatars/avatars-storage.service.js';
import { AvatarsModule } from '../modules/avatars/avatars.module.js';
import { createModuleApp } from './helpers/create-module-app.js';

describe('AvatarsModule', () => {
    let app: NestExpressApplication;
    let storage: AvatarsStorageService;

    beforeAll(async () => {
        app = await createModuleApp([AvatarsModule]);
        storage = app.get(AvatarsStorageService);
    });
    afterAll(async () => {
        await app.close();
    });

    it('GET /avatars/:file - publik, header sama dengan sumber', async () => {
        vi.spyOn(storage, 'isConfigured', 'get').mockReturnValue(true);
        vi.spyOn(storage, 'getAvatar').mockResolvedValue({
            stream: Readable.from(['data']),
            contentType: 'image/png',
        });
        const res = await request(app.getHttpServer()).get('/avatars/sample.png');
        expect(res.status).toBe(200);
        expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['content-type']).toContain('image/png');
    });

    it('GET /avatars/:file - 404 saat storage belum dikonfigurasi', async () => {
        vi.spyOn(storage, 'isConfigured', 'get').mockReturnValue(false);
        const res = await request(app.getHttpServer()).get('/avatars/sample.png');
        expect(res.status).toBe(404);
    });

    it('GET /avatars/:file - 404 saat berkas tidak ada', async () => {
        vi.spyOn(storage, 'isConfigured', 'get').mockReturnValue(true);
        vi.spyOn(storage, 'getAvatar').mockResolvedValue(null);
        const res = await request(app.getHttpServer()).get('/avatars/tidak-ada.png');
        expect(res.status).toBe(404);
    });
});

describe('AvatarsStorageService', () => {
    it('tidak terkonfigurasi tanpa AWS_ENDPOINT_URL_S3 dan kunci', () => {
        const saved = { ...process.env };
        delete process.env.AWS_ENDPOINT_URL_S3;
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        expect(new AvatarsStorageService().isConfigured).toBe(false);
        Object.assign(process.env, saved);
    });

    it('terkonfigurasi dengan env yang sama seperti render.yaml', () => {
        process.env.AWS_ENDPOINT_URL_S3 = 'https://s3.example.test';
        process.env.AWS_ACCESS_KEY_ID = 'k';
        process.env.AWS_SECRET_ACCESS_KEY = 's';
        expect(new AvatarsStorageService().isConfigured).toBe(true);
    });

    it('menolak nama berkas tidak valid (path traversal) tanpa menyentuh S3', async () => {
        process.env.AWS_ENDPOINT_URL_S3 = 'https://s3.example.test';
        process.env.AWS_ACCESS_KEY_ID = 'k';
        process.env.AWS_SECRET_ACCESS_KEY = 's';
        const svc = new AvatarsStorageService();
        expect(await svc.getAvatar('..%2Fsecret.png')).toBeNull();
        expect(await svc.getAvatar('a.exe')).toBeNull();
    });
});
