import { CapacitorHttp } from '@capacitor/core';
import type { Logger } from '../logging/logger';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface TransportRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  data?: unknown;
  timeoutMs: number;
}

export interface TransportResult {
  status: number;
  data: unknown;
}

/** Pengirim HTTP. Implementasi nyata: capacitorTransport (native, bebas CORS). */
export type Transport = (request: TransportRequest) => Promise<TransportResult>;

export const capacitorTransport: Transport = async (request) => {
  const result = await CapacitorHttp.request({
    url: request.url,
    method: request.method,
    headers: request.headers,
    data: request.data,
    connectTimeout: request.timeoutMs,
    readTimeout: request.timeoutMs,
  });
  return { status: result.status, data: result.data as unknown };
};

/** Kegagalan tanpa response HTTP: timeout atau koneksi putus. */
export class NetworkError extends Error {
  readonly kind: 'timeout' | 'network';

  constructor(kind: 'timeout' | 'network', message: string) {
    super(message);
    this.name = 'NetworkError';
    this.kind = kind;
  }
}

/** Status 4xx/5xx TIDAK melempar error (setara expectSuccess = false): caller memeriksa `ok`. */
export interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  data: T;
}

export interface ApiClientOptions {
  /** Hanya scheme + host. Path (mis. "") ditulis di setiap endpoint. */
  baseUrl: string;
  timeoutMs: number;
  transport: Transport;
  getToken: () => string | null;
  /** Dipanggil saat request ber-token ditolak 401. Harus idempotent (bisa terpanggil beruntun). */
  onUnauthorized: () => void;
  logger: Pick<Logger, 'warn' | 'error'>;
}

export class ApiClient {
  private readonly options: ApiClientOptions;

  constructor(options: ApiClientOptions) {
    this.options = options;
  }

  get<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path);
  }

  post<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  put<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  async request<T = unknown>(
    method: HttpMethod,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    // Path wajib absolut ("/..."), konsisten dengan aturan ApiClient.kt.
    if (!path.startsWith('/')) throw new Error(`Path endpoint harus diawali "/": ${path}`);

    const { baseUrl, timeoutMs, transport, getToken, logger } = this.options;
    const token = getToken();
    const hasToken = token !== null && token.trim() !== '';

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (hasToken) headers.Authorization = `Bearer ${token}`;

    // Hanya method dan path (tanpa query/body/token) yang dicatat.
    const label = `${method} ${path.split('?')[0] ?? path}`;

    let result: TransportResult;
    try {
      result = await withTimeout(
        transport({
          method,
          url: baseUrl.replace(/\/+$/, '') + path,
          headers,
          data: body,
          timeoutMs,
        }),
        timeoutMs
      );
    } catch (error) {
      const failure =
        error instanceof NetworkError
          ? error
          : new NetworkError('network', error instanceof Error ? error.message : 'Koneksi gagal');
      logger.error('HTTP', `${label} -> ${failure.kind}`, failure);
      throw failure;
    }

    if (result.status >= 400) {
      const message = `${label} -> ${String(result.status)}`;
      if (result.status >= 500) logger.error('HTTP', message);
      else logger.warn('HTTP', message);
    }
    // 401 pada request ber-token = sesi berakhir. Pada login (tanpa token) 401 = kredensial salah.
    if (result.status === 401 && hasToken) this.options.onUnauthorized();

    return {
      status: result.status,
      ok: result.status >= 200 && result.status < 300,
      data: result.data as T,
    };
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new NetworkError('timeout', `Waktu habis setelah ${String(timeoutMs / 1000)} detik`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
}
