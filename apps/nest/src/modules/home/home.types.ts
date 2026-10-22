import { ApiResponse } from '../../common/types/api-response.type.js';

export interface KursDataDto {
    base: string;
    target: string;
    rate: number;
    change: number;
}

/** Setara MarketIndicatorDto sumber: Symbol, Name, Price, Change (persen). */
export interface MarketIndicatorDto {
    symbol: string;
    name: string;
    price: number;
    change: number;
}

export interface ApiIndonesiaKursResponse {
    success: boolean;
    message?: string;
    data?: {
        base: string;
        target: string;
        rate: number;
        change: number;
    };
}

export type KursResponse = ApiResponse<KursDataDto>;
export type MarketIndicatorsResponse = ApiResponse<MarketIndicatorDto[]>;
