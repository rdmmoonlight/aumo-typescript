import { baseApi } from "@/lib/apiClient";

// --- Types Request & Response ---
export interface KursParams {
  baseCurrency?: string;
  targetCurrency?: string;
}

export interface KursResponse {
  success?: boolean;
  baseCurrency?: string;
  targetCurrency?: string;
  rate?: number;
  lastUpdated?: string;
  [key: string]: unknown;
}

export interface MarketIndicatorItem {
  id?: string;
  name?: string;
  symbol?: string;
  value?: number;
  changePercent?: number;
  [key: string]: unknown;
}

export interface MarketIndicatorsResponse {
  success?: boolean;
  indicators?: MarketIndicatorItem[];
  [key: string]: unknown;
}

// --- Inject Endpoints ke baseApi ---
export const homeApi = baseApi.injectEndpoints({
  // Mencegah error 'called injectEndpoints to override already-existing endpointName'
  // saat Fast Refresh / HMR di Next.js & Turbopack
  overrideExisting: !process.env.PROD,

  endpoints: (builder) => ({
    // 1. GET /kurs
    getKurs: builder.query<KursResponse, KursParams | void>({
      query: (params) => ({
        url: "/kurs", // Wajib diawali slash '/'
        params: params
          ? {
              baseCurrency: params.baseCurrency,
              targetCurrency: params.targetCurrency,
            }
          : undefined,
      }),
      providesTags: ["MarketData"],
    }),

    // 2. GET /home/market-indicators
    getMarketIndicators: builder.query<MarketIndicatorsResponse, void>({
      query: () => ({
        url: "/home/market-indicators", // Wajib diawali slash '/'
      }),
      providesTags: ["MarketData"],
    }),
  }),
});
