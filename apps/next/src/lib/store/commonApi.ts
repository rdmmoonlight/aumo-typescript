// src/lib/commonApi.ts
import { baseApi } from "@/lib/apiClient";

// --- Types Request & Response ---
export type HealthCheckResponse = {
  status?: string;
  timestamp?: string;
  [key: string]: unknown;
};

export type NotificationItem = {
  id: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
  [key: string]: unknown;
};

export type GetNotificationsArg = {
  limit?: number | string;
};

export type MarkNotificationReadArg = {
  id: string;
};

export type CommonActionResponse = {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};

// --- Inject Endpoints Manual ---
export const commonApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /
    getRoot: builder.query<unknown, void>({
      query: () => "/",
      providesTags: ["AumoBackend"],
    }),

    // HEAD /
    checkRootHead: builder.mutation<unknown, void>({
      query: () => ({
        url: "/",
        method: "HEAD",
      }),
      invalidatesTags: ["AumoBackend"],
    }),

    // GET /health
    getHealth: builder.query<HealthCheckResponse, void>({
      query: () => "/health",
      providesTags: ["Health"],
    }),

    // GET /notifications
    getNotifications: builder.query<
      NotificationItem[],
      GetNotificationsArg | void
    >({
      query: (arg) => ({
        url: "/notifications",
        params: arg?.limit ? { limit: arg.limit } : undefined,
      }),
      providesTags: ["Notifications"],
    }),

    // PUT /notifications/{id}/read
    markNotificationAsRead: builder.mutation<
      CommonActionResponse,
      MarkNotificationReadArg
    >({
      query: ({ id }) => ({
        url: `/notifications/${id}/read`,
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // PUT /notifications/read-all
    markAllNotificationsAsRead: builder.mutation<CommonActionResponse, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});
