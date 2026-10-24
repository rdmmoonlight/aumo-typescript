import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { matchesImageSignature } from '../modules/settings/settings.schemas.js';
import { AvatarsStorageService } from '../modules/avatars/avatars-storage.service.js';
import { SettingsModule } from '../modules/settings/settings.module.js';
import { createModuleApp } from './helpers/create-module-app.js';

const USER = '11111111-1111-1111-1111-111111111111';
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
const GIF = Buffer.concat([Buffer.from('GIF89a', 'latin1'), Buffer.alloc(32)]);
const WEBP = Buffer.concat([Buffer.from('RIFF', 'latin1'), Buffer.alloc(4), Buffer.from('WEBP', 'latin1'), Buffer.alloc(16)]);

describe('matchesImageSignature', () => {
    it.each([
        [PNG, '.png', true],
        [JPG, '.jpg', true],
        [JPG, '.JPEG', true],
        [GIF, '.gif', true],
        [WEBP, '.webp', true],
        [Buffer.from('<svg></svg>'), '.png', false],
        [PNG, '.jpg', false],
        [Buffer.alloc(0), '.png', false],
        [PNG, '.bmp', false],
    ])('%#', (buffer, ext, expected) => {
        expect(matchesImageSignature(buffer, ext)).toBe(expected);
    });
});

describe('SettingsModule: POST /settings/avatar', () => {
    let app: NestExpressApplication;
    let storage: AvatarsStorageService;
    const upload = vi.fn();

    const post = (user: string | null = USER) => {
        const http = request(app.getHttpServer()).post('/settings/avatar');
        return user ? http.set('X-User-Id', user) : http;
    };

    beforeAll(async () => {
        app = await createModuleApp([SettingsModule]);
        storage = app.get(AvatarsStorageService);
    });
    afterAll(async () => {
        await app.close();
    });
    beforeEach(() => {
        upload.mockReset().mockResolvedValue(undefined);
        vi.spyOn(storage, 'isConfigured', 'get').mockReturnValue(true);
        vi.spyOn(storage, 'uploadAvatar').mockImplementation(upload);
        process.env.PUBLIC_API_URL = 'https://aumo.test/api/';
    });
    afterEach(() => {
        vi.restoreAllMocks();
        delete process.env.PUBLIC_API_URL;
    });

    it('401 tanpa X-User-Id', async () => {
        const res = await post(null).attach('file', PNG, 'a.png');
        expect(res.status).toBe(401);
    });

    it('field `file`: mengunggah dan mengembalikan avatarUrl datar sesuai sumber', async () => {
        const res = await post().attach('file', PNG, { filename: 'foto.PNG', contentType: 'image/png' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            success: true,
            message: 'Avatar uploaded successfully.',
            avatarUrl: expect.stringMatching(
                new RegExp(`^https://aumo\\.test/api/avatars/avatar_${USER}_[0-9a-f-]{36}\\.png$`),
            ),
        });
        const [fileName, body, contentType] = upload.mock.calls[0];
        expect(fileName).toMatch(new RegExp(`^avatar_${USER}_[0-9a-f-]{36}\\.png$`));
        expect(Buffer.isBuffer(body)).toBe(true);
        expect(contentType).toBe('image/png');
    });

    it('field `avatar` dan berkas pertama (flexible binding) diterima', async () => {
        const a = await post().attach('avatar', JPG, { filename: 'a.jpg', contentType: 'image/jpeg' });
        expect(a.status).toBe(200);
        const b = await post().attach('foto', GIF, { filename: 'b.gif', contentType: 'image/gif' });
        expect(b.status).toBe(200);
        expect(b.body.avatarUrl).toMatch(/\.gif$/);
    });

    it('PUBLIC_API_URL kosong: URL dibentuk dari header proxy', async () => {
        delete process.env.PUBLIC_API_URL;
        const res = await post()
            .set('X-Forwarded-Proto', 'https')
            .set('X-Forwarded-Host', 'app.aumo.id')
            .attach('file', WEBP, { filename: 'a.webp', contentType: 'image/webp' });
        expect(res.status).toBe(200);
        expect(res.body.avatarUrl).toMatch(/^https:\/\/app\.aumo\.id\/api\/avatars\/avatar_/);
    });

    it('tanpa berkas: 400 dengan pesan sumber', async () => {
        const res = await post().field('x', 'y');
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: "No file uploaded. Ensure the form-data key is named 'file' or 'avatar'.",
        });
    });

    it('lebih dari 2 MB: 400', async () => {
        const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]);
        const res = await post().attach('file', big, { filename: 'a.png', contentType: 'image/png' });
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ success: false, message: 'File size exceeds limit (Max 2MB).' });
        expect(upload).not.toHaveBeenCalled();
    });

    it.each([
        ['ekstensi tidak diizinkan', 'a.svg', 'image/svg+xml', PNG],
        ['Content-Type tidak diizinkan', 'a.png', 'application/pdf', PNG],
        ['isi berkas tidak sesuai ekstensi (dipalsukan)', 'a.png', 'image/png', Buffer.from('<script>alert(1)</script>')],
    ])('tipe tidak valid: %s', async (_name, filename, contentType, body) => {
        const res = await post().attach('file', body, { filename, contentType });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.',
            errors: ['Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.'],
        });
        expect(upload).not.toHaveBeenCalled();
    });

    it('bucket belum dikonfigurasi: 500 tanpa membocorkan detail', async () => {
        vi.spyOn(storage, 'isConfigured', 'get').mockReturnValue(false);
        const res = await post().attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ success: false, message: 'Terjadi kesalahan pada server' });
    });

    it('kegagalan unggah ke S3: 500 tanpa membocorkan detail', async () => {
        upload.mockRejectedValue(new Error('AccessDenied: kunci rahasia salah'));
        const res = await post().attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
        expect(res.status).toBe(500);
        expect(JSON.stringify(res.body)).not.toContain('AccessDenied');
    });

    it('userId tidak aman (path traversal) ditolak sebelum menyentuh storage', async () => {
        const res = await post('../../etc/passwd').attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
        expect(res.status).toBe(401);
        expect(upload).not.toHaveBeenCalled();
    });
});
