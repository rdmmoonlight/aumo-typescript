import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transport, TransportRequest, TransportResult } from './apiClient';
import { ApiClient, NetworkError } from './apiClient';

function setup(options?: {
  token?: string | null;
  result?: TransportResult;
  transport?: Transport;
  timeoutMs?: number;
  baseUrl?: string;
}) {
  const calls: TransportRequest[] = [];
  const transport: Transport =
    options?.transport ??
    ((request) => {
      calls.push(request);
      return Promise.resolve(options?.result ?? { status: 200, data: { hello: 'dunia' } });
    });
  const onUnauthorized = vi.fn();
  const logger = { warn: vi.fn(), error: vi.fn() };
  const client = new ApiClient({
    baseUrl: options?.baseUrl ?? 'https://api.test',
    timeoutMs: options?.timeoutMs ?? 45_000,
    transport,
    getToken: () => options?.token ?? null,
    onUnauthorized,
    logger,
  });
  return { client, calls, onUnauthorized, logger };
}

describe('ApiClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('menyisipkan Bearer token bila ada sesi', async () => {
    const { client, calls } = setup({ token: 'abc123' });
    await client.get('/auth/me');
    expect(calls[0]?.headers.Authorization).toBe('Bearer abc123');
    expect(calls[0]?.url).toBe('https://api.test/auth/me');
  });

  it('tanpa token: tidak ada header Authorization', async () => {
    const { client, calls } = setup({ token: null });
    await client.get('/x');
    expect(calls[0]?.headers).not.toHaveProperty('Authorization');
  });

  it('token kosong/spasi dianggap tidak ada', async () => {
    const { client, calls } = setup({ token: '   ' });
    await client.get('/x');
    expect(calls[0]?.headers).not.toHaveProperty('Authorization');
  });

  it('POST dengan body mengirim Content-Type JSON', async () => {
    const { client, calls } = setup();
    await client.post('/auth/login', { a: 1 });
    expect(calls[0]?.headers['Content-Type']).toBe('application/json');
    expect(calls[0]?.data).toEqual({ a: 1 });
    expect(calls[0]?.method).toBe('POST');
  });

  it('GET tanpa body tidak mengirim Content-Type', async () => {
    const { client, calls } = setup();
    await client.get('/x');
    expect(calls[0]?.headers).not.toHaveProperty('Content-Type');
  });

  it('batas waktu 45 detik dikirim ke transport', async () => {
    const { client, calls } = setup();
    await client.get('/x');
    expect(calls[0]?.timeoutMs).toBe(45_000);
  });

  it('membuang garis miring di akhir baseUrl', async () => {
    const { client, calls } = setup({ baseUrl: 'https://api.test///' });
    await client.get('/x');
    expect(calls[0]?.url).toBe('https://api.test/x');
  });

  it('menolak path yang tidak diawali "/"', async () => {
    const { client } = setup();
    await expect(client.get('api/v1/x')).rejects.toThrow('diawali "/"');
  });

  it('timeout: melempar NetworkError(timeout) setelah 45 detik dan mencatat log', async () => {
    const { client, logger } = setup({
      transport: () => new Promise<TransportResult>(() => undefined),
    });
    const pending = client.get('/lambat');
    const assertion = expect(pending).rejects.toMatchObject({
      name: 'NetworkError',
      kind: 'timeout',
    });
    await vi.advanceTimersByTimeAsync(45_000);
    await assertion;
    expect(logger.error).toHaveBeenCalledWith(
      'HTTP',
      'GET /lambat -> timeout',
      expect.any(NetworkError)
    );
  });

  it('belum timeout sebelum 45 detik', async () => {
    let resolve: (value: TransportResult) => void = () => undefined;
    const { client } = setup({
      transport: () =>
        new Promise<TransportResult>((r) => {
          resolve = r;
        }),
    });
    const pending = client.get('/x');
    await vi.advanceTimersByTimeAsync(44_000);
    resolve({ status: 200, data: 'ok' });
    await expect(pending).resolves.toMatchObject({ status: 200, ok: true, data: 'ok' });
  });

  it('error koneksi dibungkus NetworkError(network)', async () => {
    const { client, logger } = setup({ transport: () => Promise.reject(new Error('ECONNRESET')) });
    await expect(client.get('/x')).rejects.toMatchObject({
      name: 'NetworkError',
      kind: 'network',
      message: 'ECONNRESET',
    });
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('401 pada request ber-token memanggil onUnauthorized', async () => {
    const { client, onUnauthorized } = setup({ token: 't', result: { status: 401, data: null } });
    const response = await client.get('/auth/me');
    expect(response.status).toBe(401);
    expect(response.ok).toBe(false);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('401 pada login (tanpa token) = kredensial salah, bukan logout', async () => {
    const { client, onUnauthorized } = setup({
      token: null,
      result: { status: 401, data: { success: false } },
    });
    await client.post('/auth/login', {});
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('4xx dicatat WARN, 5xx dicatat ERROR, tanpa query string', async () => {
    const r4 = setup({ result: { status: 404, data: null } });
    await r4.client.get('/x?secret=1');
    expect(r4.logger.warn).toHaveBeenCalledWith('HTTP', 'GET /x -> 404');

    const r5 = setup({ result: { status: 503, data: null } });
    await r5.client.post('/y', {});
    expect(r5.logger.error).toHaveBeenCalledWith('HTTP', 'POST /y -> 503');
  });

  it('status 2xx tidak dicatat dan ok = true; 4xx tidak melempar', async () => {
    const ok = setup();
    const res = await ok.client.get('/x');
    expect(res.ok).toBe(true);
    expect(ok.logger.warn).not.toHaveBeenCalled();
    expect(ok.logger.error).not.toHaveBeenCalled();

    const bad = setup({ result: { status: 400, data: { message: 'x' } } });
    await expect(bad.client.get('/x')).resolves.toMatchObject({ ok: false, status: 400 });
  });
});
