/** Alamat backend bawaan (sama dengan BASE_URL di ApiClient.kt). */
export const DEFAULT_API_URL = 'https://aumonext-api.onrender.com';

/** Hanya scheme + host. Path (mis. "") ditulis di setiap endpoint. */
const fromEnv = import.meta.env.VITE_API_URL?.trim();
export const API_URL: string = fromEnv !== undefined && fromEnv !== '' ? fromEnv : DEFAULT_API_URL;

/**
 * Cold start Render free-tier bisa 30-60 detik, jadi batas waktu 10 detik bawaan
 * terlalu pendek. Nilai ini wajib (lihat MIGRASI-CAPACITOR.md, Bagian 3).
 */
export const NETWORK_TIMEOUT_MS = 45_000;
