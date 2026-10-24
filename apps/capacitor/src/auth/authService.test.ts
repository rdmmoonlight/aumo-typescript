import { describe, expect, it, vi } from 'vitest';
import type { Transport, TransportRequest, TransportResult } from '../network/apiClient';
import { ApiClient, NetworkError } from '../network/apiClient';
import { Session } from '../network/session';
import type { KeyValueStore } from '../network/sessionStore';
import { SessionStore } from '../network/sessionStore';
import { AuthApi } from './authApi';
import { AuthService } from './authService';

function build(handler: (request: TransportRequest) => Promise<TransportResult>) {
  const calls: TransportRequest[] = [];
  const transport: Transport = (request) => {
    calls.push(request);
    return handler(request);
  };
  const data = new Map<string, string>();
  const kv: KeyValueStore = {
    get: (key) => Promise.resolve(data.get(key) ?? null),
    set: (key, value) => {
      data.set(key, value);
      return Promise.resolve();
    },
    clear: () => {
      data.clear();
      return Promise.resolve();
    },
  };
  const session = new Session();
  const sessionStore = new SessionStore(kv);
  const logger = { warn: vi.fn(), error: vi.fn() };
  const client = new ApiClient({
    baseUrl: 'https://api.test',
    timeoutMs: 45_000,
    transport,
    getToken: () => session.token,
    onUnauthorized: () => {
      session.clear();
    },
    logger,
  });
  const service = new AuthService({ api: new AuthApi(client), session, sessionStore, logger });
  return { service, session, sessionStore, calls, logger };
}

const success = {
  status: 200,
  data: { success: true, message: 'ok', userId: 'u1', fullName: 'Ghofur', token: 'jwt' },
};
const creds = { email: 'a@b.c', password: 'rahasia', keepSignedIn: false, enableBiometric: false };

describe('AuthService.signIn', () => {
  it('login sukses: mengisi Session dan mengirim isMobileClient + endpoint yang benar', async () => {
    const { service, session, calls } = build(() => Promise.resolve(success));
    const result = await service.signIn(creds);

    expect(result).toEqual({ ok: true, fullName: 'Ghofur' });
    expect(session.token).toBe('jwt');
    expect(session.userId).toBe('u1');
    expect(calls[0]?.url).toBe('https://api.test/auth/login');
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.data).toEqual({
      email: 'a@b.c',
      password: 'rahasia',
      rememberMe: false,
      isMobileClient: true,
      operatingSystem: 'Android',
    });
    expect(calls[0]?.headers).not.toHaveProperty('Authorization');
  });

  it('tanpa "Ingat saya": tidak ada sesi tersimpan', async () => {
    const { service, sessionStore } = build(() => Promise.resolve(success));
    await service.signIn(creds);
    expect(await sessionStore.hasSavedSession()).toBe(false);
  });

  it('"Ingat saya": sesi tersimpan dan dapat dipulihkan', async () => {
    const { service, sessionStore } = build(() => Promise.resolve(success));
    await service.signIn({ ...creds, keepSignedIn: true });
    const restored = new Session();
    expect(await sessionStore.restoreInto(restored)).toBe(true);
    expect(restored.token).toBe('jwt');
  });

  it('biometrik tanpa "Ingat saya" tetap menyimpan sesi dan rememberMe = true', async () => {
    const { service, sessionStore, calls } = build(() => Promise.resolve(success));
    await service.signIn({ ...creds, enableBiometric: true });
    expect((calls[0]?.data as { rememberMe: boolean }).rememberMe).toBe(true);
    expect(await sessionStore.hasSavedSession()).toBe(true);
    expect(await sessionStore.isBiometricEnabled()).toBe(true);
  });

  it('kredensial salah: memakai pesan dari backend, Session tetap kosong', async () => {
    const { service, session } = build(() =>
      Promise.resolve({
        status: 401,
        data: { success: false, message: 'Email atau kata sandi salah' },
      })
    );
    expect(await service.signIn(creds)).toEqual({
      ok: false,
      message: 'Email atau kata sandi salah',
    });
    expect(session.isLoggedIn()).toBe(false);
  });

  it('pesan kosong: jatuh balik ke "Login gagal (status)"', async () => {
    const { service } = build(() =>
      Promise.resolve({ status: 400, data: { success: false, message: '  ' } })
    );
    expect(await service.signIn(creds)).toEqual({ ok: false, message: 'Login gagal (400)' });
  });

  it('body bukan JSON yang dikenali (mis. HTML proxy): "Login gagal (502)"', async () => {
    const { service } = build(() =>
      Promise.resolve({ status: 502, data: '<html>Bad Gateway</html>' })
    );
    expect(await service.signIn(creds)).toEqual({ ok: false, message: 'Login gagal (502)' });
  });

  it('success true tetapi token hilang: ditolak', async () => {
    const { service, session } = build(() =>
      Promise.resolve({
        status: 200,
        data: { success: true, message: '', userId: 'u1', fullName: 'G' },
      })
    );
    const result = await service.signIn(creds);
    expect(result.ok).toBe(false);
    expect(session.isLoggedIn()).toBe(false);
  });

  it('kegagalan jaringan: pesan error dikembalikan dan dicatat', async () => {
    const { service, logger } = build(() =>
      Promise.reject(new NetworkError('timeout', 'Waktu habis'))
    );
    const result = await service.signIn(creds);
    expect(result).toEqual({ ok: false, message: 'Waktu habis' });
    expect(logger.error).toHaveBeenCalledWith('AuthService', 'Error tertangkap', expect.any(Error));
  });
});

describe('AuthService.signOut', () => {
  it('memanggil API logout dengan token lama, lalu menghapus Session dan penyimpanan', async () => {
    const { service, session, sessionStore, calls } = build((request) =>
      Promise.resolve(request.url.endsWith('/login') ? success : { status: 200, data: null })
    );
    await service.signIn({ ...creds, keepSignedIn: true });
    await service.signOut();

    const logoutCall = calls.find((c) => c.url.endsWith('/auth/logout'));
    expect(logoutCall?.headers.Authorization).toBe('Bearer jwt');
    expect(session.isLoggedIn()).toBe(false);
    expect(await sessionStore.hasSavedSession()).toBe(false);
  });

  it('tetap berhasil walau API logout gagal', async () => {
    const { service, session } = build((request) =>
      request.url.endsWith('/login')
        ? Promise.resolve(success)
        : Promise.reject(new Error('offline'))
    );
    await service.signIn(creds);
    await expect(service.signOut()).resolves.toBeUndefined();
    expect(session.isLoggedIn()).toBe(false);
  });
});
