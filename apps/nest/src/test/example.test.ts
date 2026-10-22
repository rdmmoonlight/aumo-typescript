// src/test/example.test.ts
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../app.module.js';
import { ExampleService } from '../modules/example/example.service.js';

describe('ExampleModule (E2E)', () => {
    let app: INestApplication;

    const mockExampleService = {
        findAll: vi.fn().mockResolvedValue([
            { id: '1', title: 'Example 1' },
        ]),
        getPublicInfo: vi.fn().mockReturnValue({
            success: true,
            message: 'Informasi publik berhasil diambil',
        }),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(ExampleService)
            .useValue(mockExampleService)
            .compile();

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