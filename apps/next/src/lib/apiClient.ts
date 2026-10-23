import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Helper Cookie Client-side
function getCookie(name: string): string | undefined {
  if (typeof window === "undefined" || typeof document === "undefined")
    return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}

function getBackendTarget(): string {
  // Ambil URL Backend dari NEXT_PUBLIC_API_URL dengan default "/api"
  return process.env.NEXT_PUBLIC_API_URL || "/api";
}

const BASE_URL = getBackendTarget();

export const API_BASE_URL = BASE_URL;
export const getApiBaseUrl = () => BASE_URL;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: async (headers, { arg }) => {
    // Biarkan browser menentukan Content-Type & boundary secara otomatis jika mengirim FormData
    const fetchArgs = arg as FetchArgs;
    if (
      fetchArgs &&
      typeof fetchArgs !== "string" &&
      fetchArgs.body instanceof FormData
    ) {
      headers.delete("Content-Type");
      headers.delete("content-type");
    }

    return headers;
  },
});

let isRedirecting = false;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const requestUrl = typeof args === "string" ? args : args.url;
  const requestMethod = typeof args === "string" ? "GET" : args.method || "GET";

  const fullTargetUrl = `${BASE_URL}${requestUrl}`;

  if (!requestUrl || !requestUrl.startsWith("/")) {
    console.error(
      `❌ [RTK Query Route Error]: Route "${requestUrl}" tidak diawali slash '/'. Full Target URL: "${fullTargetUrl}"`,
    );
    throw new Error(
      `[RTK Query Route Error]: Route "${requestUrl}" wajib diawali dengan slash '/'. Mohon perbaiki penulisan endpoint.`,
    );
  }

  // Clone args tanpa memutasi argumen asli jika berbentuk object dan menggunakan FormData
  let adjustedArgs = args;
  if (
    typeof args !== "string" &&
    args.body instanceof FormData &&
    args.headers
  ) {
    let headersEntries: [string, string][] = [];

    if (args.headers instanceof Headers) {
      args.headers.forEach((value, key) => {
        headersEntries.push([key, value]);
      });
    } else if (Array.isArray(args.headers)) {
      headersEntries = (args.headers as string[][]).map(([k, v]) => [
        k,
        v ?? "",
      ]);
    } else if (typeof args.headers === "object") {
      headersEntries = Object.entries(args.headers as Record<string, string>);
    }

    const newHeaders = new Headers(headersEntries);
    newHeaders.delete("Content-Type");
    newHeaders.delete("content-type");

    adjustedArgs = {
      ...args,
      headers: newHeaders,
    };
  }

  const result = await rawBaseQuery(adjustedArgs, api, extraOptions);

  if (result.error) {
    console.warn(
      `⚠️ [RTK Query Fetch Error ${result.error.status}]: ${requestMethod} ${fullTargetUrl}`,
      result.error,
    );
  }

  if (
    result.error &&
    result.error.status === 401 &&
    typeof window !== "undefined"
  ) {
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/auth") && !isRedirecting) {
      isRedirecting = true;
      window.location.replace(
        `/auth/login?redirectTo=${encodeURIComponent(currentPath)}`
      );
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  refetchOnMountOrArgChange: false,
  keepUnusedDataFor: 300,
  tagTypes: [
    "Auth",
    "Coa",
    "ChartOfAccounts",
    "Journal",
    "JournalEntry",
    "Periods",
    "Dashboard",
    "Reports",
    "Settings",
    "Tools",
    "Notifications",
    "Summary",
    "FinancialStatements",
    "GeneralLedgers",
    "Worksheet",
    "MarketData",
    "AumoBackend",
    "Health",
  ],
  endpoints: () => ({}),
});