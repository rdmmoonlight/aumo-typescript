import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../app.module.js';
import { AvatarsStorageService } from '../modules/avatars/avatars-storage.service.js';

describe('SettingsModule (E2E) - Avatar reuse existing storage', () => {
    let app: INestApplication;

    const mockStorage = {
        isConfigured: true,
        IsConfigured: true,
        buildFileName: (userId: string, name: string) => `avatar_${userId}_mock${name.slice(-4)}`,
        uploadAvatarAsync: vi.fn().mockResolvedValue(
            'https://bucket.s3.ap-southeast-1.amazonaws.com/avatars/avatar_user-123_mock.png',
        ),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(AvatarsStorageService)
            .useValue(mockStorage)
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /settings/avatar - Tanpa X-User-Id harus 401', async () => {
        const res = await request(app.getHttpServer())
            .post('/settings/avatar')
            .attach('file', Buffer.from('fake'), 'test.png');
        expect(res.status).toBe(401);
    });

    it('POST /settings/avatar - Sukses pakai key avatar (flexible)', async () => {
        const res = await request(app.getHttpServer())
            .post('/settings/avatar')
            .set('X-User-Id', 'user-123')
            .attach('avatar', Buffer.from('fake-image'), { filename: 'a.png', contentType: 'image/png' });

        expect(res.status).toBe(201);
        expect(res.body.data.avatarUrl).toContain('https://');
    });
});