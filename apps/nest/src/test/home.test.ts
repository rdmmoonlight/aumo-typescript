import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { HomeModule } from '../modules/home/home.module.js';
import { createModuleApp } from './helpers/create-module-app.js';

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('HomeModule', () => {
    let app: NestExpressApplication;

    beforeAll(async () => {
        process.env.API_INDONESIA_KEY = 'kunci-uji';
        app = await createModuleApp([HomeModule]);
    });
    afterAll(async () => {
        await app.close();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('GET /kurs - publik, memetakan respons provider', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            json({ success: true, data: { base: 'USD', target: 'IDR', rate: 16000, change: 0.1 } }),
        );
        const res = await request(app.getHttpServer()).get('/kurs?baseCurrency=USD&targetCurrency=IDR');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            success: true,
            message: 'Berhasil mendapatkan data nilai tukar rupiah.',
            data: { base: 'USD', target: 'IDR', rate: 16000, change: 0.1 },
        });
    });

    it('GET /kurs - meneruskan status provider saat gagal', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({}, 502));
        const res = await request(app.getHttpServer()).get('/kurs');
        expect(res.status).toBe(502);
        expect(res.body.success).toBe(false);
    });

    it('GET /kurs - 400 bila format provider tidak sesuai', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ success: false }));
        const res = await request(app.getHttpServer()).get('/kurs');
        expect(res.status).toBe(400);
    });

    it('GET /home/market-indicators - 401 tanpa X-User-Id', async () => {
        const res = await request(app.getHttpServer()).get('/home/market-indicators');
        expect(res.status).toBe(401);
    });

    it('GET /home/market-indicators - USD/IDR dan IHSG', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
            const url = String(input);
            if (url.includes('IDR=X')) {
                return json({
                    chart: { result: [{ meta: { regularMarketPrice: 16100, chartPreviousClose: 16000 } }] },
                });
            }
            if (url.includes('idx.co.id')) {
                return json({ data: [{ IndexCode: 'COMPOSITE', Close: '7100', Previous: '7000' }] });
            }
            return json({}, 404);
        });
        const res = await request(app.getHttpServer())
            .get('/home/market-indicators')
            .set('X-User-Id', 'user-123');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual([
            { symbol: 'USD/IDR', name: 'Dolar AS / Rupiah', price: 16100, change: 0.63 },
            { symbol: 'IHSG', name: 'Indeks Harga Saham Gabungan', price: 7100, change: 1.43 },
        ]);
    });

    it('GET /home/market-indicators - success=false saat semua penyedia gagal', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('jaringan'));
        // aplikasi baru agar cache IHSG (5 menit) dari tes sebelumnya tidak terbawa
        const fresh = await createModuleApp([HomeModule]);
        const res = await request(fresh.getHttpServer())
            .get('/home/market-indicators')
            .set('X-User-Id', 'user-123');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            success: false,
            message: 'Data pasar belum tersedia dari penyedia eksternal.',
            data: [],
        });
        await fresh.close();
    });
});
