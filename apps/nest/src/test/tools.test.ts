import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module.js';

describe('ToolsModule (E2E)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /tools/download-journal-template - Tanpa X-User-Id harus 401', async () => {
        const res = await request(app.getHttpServer()).get('/tools/download-journal-template');
        expect(res.status).toBe(401);
    });

    it('GET /tools/download-journal-template - Dengan X-User-Id harus 200 + excel', async () => {
        const res = await request(app.getHttpServer())
            .get('/tools/download-journal-template')
            .set('X-User-Id', 'user-123');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('application/vnd.openxmlformats');
        expect((res.body as Buffer).length).toBeGreaterThan(500);
    });

    const validPayload = {
        targetYear: 2026,
        targetMonth: 5,
        transactions: [
            {
                date: '2026-05-10',
                journalType: 'GJ',
                lines: [
                    { refNumber: 101, accountName: 'Cash', description: 'Terima tunai', debit: 1000000, credit: null },
                    { refNumber: 401, accountName: 'Sales Revenue', description: 'Penjualan', debit: null, credit: 1000000 },
                ],
            },
        ],
    };

    it('POST /tools/preview-journal-import - Valid', async () => {
        const res = await request(app.getHttpServer())
            .post('/tools/preview-journal-import')
            .set('X-User-Id', 'user-preview-1')
            .send(validPayload);
        expect(res.status).toBe(201);
        expect(res.body.data.transactions[0].transactionNumber).toMatch(/^GJ2605\d{5}$/);
    });

    it('POST /tools/import-journal-entries - Import sukses', async () => {
        const res = await request(app.getHttpServer())
            .post('/tools/import-journal-entries')
            .set('X-User-Id', 'user-import-1')
            .send(validPayload);
        expect(res.status).toBe(201);
        expect(res.body.data.importedEntriesCount).toBe(1);
    });
});