// src/lib/store/(authenticated)/dashboard/dashboardApi.ts
import { baseApi } from "@/lib/apiClient";

// --- Types ---
export type GetDashboardApiArg = {
  period?: string;
};

export type GetDashboardApiResponse = unknown; // Sesuaikan dengan DTO/Model dari Controller ASP.NET jika ada

// --- API Slice ---
export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<GetDashboardApiResponse, GetDashboardApiArg>({
      query: (arg) => ({
        url: "/dashboard", // Wajib diawali dengan '/'
        params: {
          period: arg?.period,
        },
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});
