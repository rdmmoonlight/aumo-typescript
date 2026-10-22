import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../app.module.js';
import { AvatarsStorageService } from '../modules/avatars/avatars-storage.service.js';

describe('AvatarsModule (E2E)', () => {
    let app: INestApplication;
    let storageService: AvatarsStorageService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        storageService = moduleFixture.get<AvatarsStorageService>(AvatarsStorageService);
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /avatars/:fileName - Tanpa X-User-Id (Lolos karena @Public)', async () => {
        vi.spyOn(storageService, 'isConfigured', 'get').mockReturnValue(true);
        vi.spyOn(storageService, 'getAvatar').mockResolvedValue({
            stream: Readable.from(['fake-image-data']),
            contentType: 'image/png',
        });

        const res = await request(app.getHttpServer()).get('/avatars/sample.png');

        expect(res.status).toBe(200);
        expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['content-type']).toContain('image/png');
    });

    it('GET /avatars/:fileName - 404 saat storage belum terkonfigurasi', async () => {
        vi.spyOn(storageService, 'isConfigured', 'get').mockReturnValue(false);

        const res = await request(app.getHttpServer()).get('/avatars/sample.png');

        expect(res.status).toBe(404);
    });

    it('GET /avatars/:fileName - 404 saat file tidak ditemukan di S3', async () => {
        vi.spyOn(storageService, 'isConfigured', 'get').mockReturnValue(true);
        vi.spyOn(storageService, 'getAvatar').mockResolvedValue(null);

        const res = await request(app.getHttpServer()).get('/avatars/non-existent.png');

        expect(res.status).toBe(404);
    });
});