import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
import { GetKursQueryDto, getKursQuerySchema } from './home.schemas.js';
import { HomeService } from './home.service.js';
import { KursResponse, MarketIndicatorsResponse } from './home.types.js';

@Controller()
export class HomeController {
    constructor(private readonly homeService: HomeService) { }

    @Get('kurs')
    @Public()
    async getKurs(@Query() query: GetKursQueryDto): Promise<KursResponse> {
        const parsedQuery = getKursQuerySchema.parse(query);
        const data = await this.homeService.getKurs(parsedQuery);

        return {
            success: true,
            message: 'Berhasil mendapatkan data nilai tukar rupiah.',
            data,
        };
    }

    @Get('home/market-indicators')
    async getMarketIndicators(): Promise<MarketIndicatorsResponse> {
        const data = await this.homeService.getMarketIndicators();

        return {
            success: data.length > 0,
            message: data.length > 0
                ? 'Berhasil mendapatkan indikator pasar.'
                : 'Data pasar belum tersedia dari penyedia eksternal.',
            data,
        };
    }
}