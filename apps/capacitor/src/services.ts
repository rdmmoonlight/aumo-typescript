// Composition root: merakit lapisan data. Hanya modul ini yang mengikat
// implementasi Capacitor; modul lain menerima dependensi lewat konstruktor
// sehingga bisa diuji tanpa perangkat.
import { AuthApi } from './auth/authApi';
import { AuthService } from './auth/authService';
import { capacitorBiometric } from './auth/capacitorBiometric';
import { LaunchService } from './auth/launchService';
import { API_URL, NETWORK_TIMEOUT_MS } from './config/env';
import { fileLogSink } from './logging/fileLogSink';
import { Logger } from './logging/logger';
import { ApiClient, capacitorTransport } from './network/apiClient';
import { secureKeyValueStore } from './network/secureKeyValueStore';
import { Session } from './network/session';
import { SessionStore } from './network/sessionStore';

export const logger = new Logger(fileLogSink);
export const session = new Session();
export const sessionStore = new SessionStore(secureKeyValueStore);

/**
 * Dipasang di main.ts untuk berpindah ke Login saat server menolak token (401).
 * Sesi sudah dibersihkan di sini, sehingga request berikutnya tidak memakai token basi.
 */
let unauthorizedListener: (() => void) | null = null;
export function setUnauthorizedListener(listener: (() => void) | null): void {
  unauthorizedListener = listener;
}

export const apiClient = new ApiClient({
  baseUrl: API_URL,
  timeoutMs: NETWORK_TIMEOUT_MS,
  transport: capacitorTransport,
  getToken: () => session.token,
  onUnauthorized: () => {
    session.clear();
    void sessionStore.clear();
    unauthorizedListener?.();
  },
  logger,
});

export const authApi = new AuthApi(apiClient);
export const authService = new AuthService({ api: authApi, session, sessionStore, logger });
export const launchService = new LaunchService({
  session,
  sessionStore,
  biometric: capacitorBiometric,
  logger,
});
