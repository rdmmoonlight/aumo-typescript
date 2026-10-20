/** Base URL backend. Atur lewat VITE_API_URL di .env atau Environment Variable platform deploy. */
const rawApiUrl =
  (import.meta.env["VITE_API_URL"] as string | undefined) || "/api";

export const API_URL: string = rawApiUrl.replace(/\/$/, "");