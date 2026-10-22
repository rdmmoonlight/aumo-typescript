import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GetKursQueryDto } from './home.schemas.js';
import { ApiIndonesiaKursResponse, KursDataDto, MarketIndicatorDto } from './home.types.js';

@Injectable()
export class HomeService {
    private readonly logger = new Logger(HomeService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    async getKurs(query: GetKursQueryDto): Promise<KursDataDto> {
        const apiKey = this.configService.get<string>('API_INDONESIA_KEY');
        if (!apiKey) {
            this.logger.error('API Key untuk ApiIndonesia belum dikonfigurasi.');
            throw new InternalServerErrorException({
                success: false,
                message: 'Konfigurasi API Key tidak ditemukan.',
            });
        }

        const baseCurrency = query.baseCurrency || 'USD';
        const targetCurrency = query.targetCurrency || 'IDR';
        const requestUrl = `https://use.apiindonesia.id/kurs/latest?base=${baseCurrency}&target=${targetCurrency}`;

        try {
            const response = await firstValueFrom(
                this.httpService.get<ApiIndonesiaKursResponse>(requestUrl, {
                    headers: { 'x-api-key': apiKey },
                    timeout: 5000,
                }),
            );

            const externalData = (response as { data: ApiIndonesiaKursResponse }).data;
            if (!externalData || !externalData.success || !externalData.data) {
                throw new BadRequestException({
                    success: false,
                    message: 'Data nilai tukar tidak ditemukan atau format tidak sesuai.',
                });
            }

            return {
                base: externalData.data.base,
                target: externalData.data.target,
                rate: externalData.data.rate,
                change: externalData.data.change,
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error;
            }
            this.logger.error('Terjadi kesalahan saat memproses data kurs.', error);
            throw new InternalServerErrorException({
                success: false,
                message: 'Gagal mengambil data nilai tukar dari layanan eksternal.',
            });
        }
    }

    async getMarketIndicators(): Promise<MarketIndicatorDto[]> {
        try {
            // Implementasi pemanggilan API indikator pasar eksternal dengan batas waktu
            const indicators: MarketIndicatorDto[] = [];
            return indicators;
        } catch (error) {
            this.logger.error('Gagal mengambil indikator pasar untuk halaman Home.', error);
            throw new InternalServerErrorException({
                success: false,
                message: 'Terjadi kesalahan internal pada server.',
            });
        }
    }
}