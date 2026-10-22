import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetKursQueryDto } from './home.schemas.js';
import { ApiIndonesiaKursResponse, KursDataDto, MarketIndicatorDto } from './home.types.js';

const TIMEOUT_MS = 5000;
const IHSG_CACHE_TTL_MS = 5 * 60 * 1000;
const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

type FetchFn = typeof fetch;

@Injectable()
export class HomeService {
    private readonly logger = new Logger(HomeService.name);
    private ihsgCache: MarketIndicatorDto | null = null;
    private ihsgCacheAt = 0;

    constructor(private readonly configService: ConfigService) { }

    /** Dapat diganti saat pengujian. */
    protected get fetchFn(): FetchFn {
        return globalThis.fetch;
    }

    private async get(url: string, headers: Record<string, string> = {}): Promise<Response> {
        return this.fetchFn(url, {
            headers: { 'User-Agent': USER_AGENT, ...headers },
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    }

    async getKurs(query: GetKursQueryDto): Promise<KursDataDto> {
        const apiKey = this.configService.get<string>('API_INDONESIA_KEY');
        if (!apiKey) {
            this.logger.error('API Key untuk ApiIndonesia belum dikonfigurasi.');
            throw new InternalServerErrorException('Konfigurasi API Key tidak ditemukan.');
        }

        const base = encodeURIComponent(query.baseCurrency || 'USD');
        const target = encodeURIComponent(query.targetCurrency || 'IDR');
        const url = `https://use.apiindonesia.id/kurs/latest?base=${base}&target=${target}`;

        try {
            const response = await this.get(url, { 'x-api-key': apiKey });
            if (!response.ok) {
                this.logger.warn(`Provider kurs mengembalikan status ${response.status}`);
                throw new HttpException(
                    'Gagal mengambil data nilai tukar dari layanan eksternal.',
                    response.status,
                );
            }

            const external = (await response.json()) as ApiIndonesiaKursResponse;
            if (!external?.success || !external.data) {
                throw new BadRequestException(
                    'Data nilai tukar tidak ditemukan atau format tidak sesuai.',
                );
            }

            const { base: b, target: t, rate, change } = external.data;
            return { base: b, target: t, rate, change };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error('Terjadi kesalahan saat memproses data kurs.', error);
            throw new InternalServerErrorException('Terjadi kesalahan internal pada server.');
        }
    }

    async getMarketIndicators(): Promise<MarketIndicatorDto[]> {
        const [usd, ihsg] = await Promise.all([this.fetchUsdRate(), this.fetchIhsg()]);
        return [usd, ihsg].filter((x): x is MarketIndicatorDto => x !== null);
    }

    private async fetchUsdRate(): Promise<MarketIndicatorDto | null> {
        for (const host of ['query1', 'query2']) {
            const result = await this.fetchYahoo(
                `https://${host}.finance.yahoo.com/v8/finance/chart/IDR=X`,
                'USD/IDR',
                'Dolar AS / Rupiah',
            );
            if (result) return result;
        }

        try {
            const response = await this.get('https://open.er-api.com/v6/latest/USD');
            if (!response.ok) return null;
            const json = (await response.json()) as { rates?: { IDR?: number } };
            const rate = json.rates?.IDR;
            if (typeof rate !== 'number') return null;
            return { symbol: 'USD/IDR', name: 'Dolar AS / Rupiah', price: rate, change: 0 };
        } catch {
            return null; // abaikan error cadangan
        }
    }

    private async fetchIhsg(): Promise<MarketIndicatorDto | null> {
        if (this.ihsgCache && Date.now() - this.ihsgCacheAt < IHSG_CACHE_TTL_MS) {
            return this.ihsgCache;
        }

        const fromIdx = await this.fetchIhsgFromIdx();
        if (fromIdx) {
            this.ihsgCache = fromIdx;
            this.ihsgCacheAt = Date.now();
            return fromIdx;
        }

        for (const host of ['query1', 'query2']) {
            const result = await this.fetchYahoo(
                `https://${host}.finance.yahoo.com/v8/finance/chart/%5EJKSE`,
                'IHSG',
                'Indeks Harga Saham Gabungan',
            );
            if (result) return result;
        }
        return null;
    }

    /** Hari bursa terakhir: mundur maksimal 7 hari (WIB), lewati akhir pekan. */
    private async fetchIhsgFromIdx(): Promise<MarketIndicatorDto | null> {
        const wibNow = new Date(Date.now() + 7 * 3600 * 1000);

        for (let i = 0; i < 7; i++) {
            const date = new Date(wibNow.getTime() - i * 86_400_000);
            const day = date.getUTCDay();
            if (day === 0 || day === 6) continue;

            const ymd = date.toISOString().slice(0, 10).replaceAll('-', '');
            try {
                const response = await this.get(
                    `https://www.idx.co.id/primary/TradingSummary/GetIndexSummary?date=${ymd}&start=0&length=9999`,
                    {
                        Accept: 'application/json, text/plain, */*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        Referer: 'https://www.idx.co.id/',
                    },
                );
                if (!response.ok) return null; // diblokir atau error: pakai cadangan

                const json = (await response.json()) as { data?: Record<string, unknown>[] };
                if (!Array.isArray(json.data)) return null;

                const item = json.data.find(
                    (x) => String(x.IndexCode ?? '').toUpperCase() === 'COMPOSITE',
                );
                if (!item) continue; // libur bursa: coba hari sebelumnya

                const close = Number(item.Close);
                if (!Number.isFinite(close) || close <= 0) return null;
                const previous = Number(item.Previous);
                const change =
                    Number.isFinite(previous) && previous > 0
                        ? ((close - previous) / previous) * 100
                        : 0;

                return {
                    symbol: 'IHSG',
                    name: 'Indeks Harga Saham Gabungan',
                    price: close,
                    change: Math.round(change * 100) / 100,
                };
            } catch {
                return null;
            }
        }
        return null;
    }

    private async fetchYahoo(
        url: string,
        symbol: string,
        name: string,
    ): Promise<MarketIndicatorDto | null> {
        try {
            const response = await this.get(url);
            if (!response.ok) return null;

            const json = (await response.json()) as {
                chart?: { result?: { meta?: Record<string, number> }[] };
            };
            const meta = json.chart?.result?.[0]?.meta;
            const price = meta?.regularMarketPrice;
            if (typeof price !== 'number') return null;

            const prev = meta?.chartPreviousClose ?? meta?.previousClose ?? price;
            const change = prev !== 0 ? ((price - prev) / prev) * 100 : 0;
            return { symbol, name, price, change: Math.round(change * 100) / 100 };
        } catch {
            return null;
        }
    }
}
