import { describe, expect, it, vi } from 'vitest';
import { LaunchService } from './launchService';
import type { BiometricPort, BiometricResult } from './launchService';
import { Session } from '../network/session';
import { SessionStore } from '../network/sessionStore';
import type { KeyValueStore } from '../network/sessionStore';

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
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
}

async function setup(options: {
  saved?: { keepSignedIn: boolean; biometricEnabled: boolean };
  available?: boolean;
  result?: BiometricResult;
}) {
  const sessionStore = new SessionStore(memoryStore());
  if (options.saved) {
    await sessionStore.save({
      token: 'jwt',
      userId: 'u1',
      fullName: 'Ghofur',
      ...options.saved,
    });
  }
  const session = new Session();
  const isAvailable = vi.fn(() => Promise.resolve(options.available ?? true));
  const authenticate = vi.fn<BiometricPort['authenticate']>(() =>
    Promise.resolve(options.result ?? { ok: true })
  );
  const biometric: BiometricPort = { isAvailable, authenticate };
  const logger = { error: vi.fn() };
  const service = new LaunchService({ session, sessionStore, biometric, logger });
  return { service, session, sessionStore, authenticate, logger };
}

describe('LaunchService.resolveStartDestination', () => {
  it('tanpa sesi tersimpan -> Login, tanpa memanggil biometrik', async () => {
    const { service, authenticate } = await setup({});
    expect(await service.resolveStartDestination()).toBe('/login');
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('"Ingat saya" tanpa biometrik -> pulihkan sesi dan ke Home', async () => {
    const { service, session, authenticate } = await setup({
      saved: { keepSignedIn: true, biometricEnabled: false },
    });
    expect(await service.resolveStartDestination()).toBe('/home');
    expect(session.token).toBe('jwt');
    expect(session.fullName).toBe('Ghofur');
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('biometrik aktif dan berhasil -> Home dengan sesi pulih', async () => {
    const { service, session, authenticate } = await setup({
      saved: { keepSignedIn: true, biometricEnabled: true },
    });
    expect(await service.resolveStartDestination()).toBe('/home');
    expect(authenticate).toHaveBeenCalledOnce();
    expect(session.isLoggedIn()).toBe(true);
  });

  it('biometrik gagal/batal -> Login; sesi memori tidak dipulihkan, sesi tersimpan tetap ada', async () => {
    const { service, session, sessionStore } = await setup({
      saved: { keepSignedIn: true, biometricEnabled: true },
      result: { ok: false, cancelled: true, message: 'Gunakan Password' },
    });
    expect(await service.resolveStartDestination()).toBe('/login');
    expect(session.isLoggedIn()).toBe(false);
    expect(await sessionStore.hasSavedSession()).toBe(true);
  });

  it('biometrik aktif tetapi tidak tersedia lagi -> sesi dipulihkan tanpa gerbang (paritas Kotlin)', async () => {
    const { service, authenticate } = await setup({
      saved: { keepSignedIn: true, biometricEnabled: true },
      available: false,
    });
    expect(await service.resolveStartDestination()).toBe('/home');
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('error tak terduga dicatat dan berakhir di Login', async () => {
    const { service, authenticate, logger } = await setup({
      saved: { keepSignedIn: true, biometricEnabled: true },
    });
    authenticate.mockRejectedValue(new Error('boom'));
    expect(await service.resolveStartDestination()).toBe('/login');
    expect(logger.error).toHaveBeenCalledOnce();
  });
});

describe('LaunchService.getBiometricLoginState', () => {
  it('perangkat tanpa biometrik: tidak menampilkan apa pun', async () => {
    const { service } = await setup({ available: false });
    expect(await service.getBiometricLoginState()).toEqual({
      showSetupCheckbox: false,
      showLoginButton: false,
    });
  });

  it('belum diaktifkan: tampilkan kotak centang setup', async () => {
    const { service } = await setup({});
    expect(await service.getBiometricLoginState()).toEqual({
      showSetupCheckbox: true,
      showLoginButton: false,
    });
  });

  it('sudah aktif dan ada sesi: tampilkan tombol masuk biometrik', async () => {
    const { service } = await setup({ saved: { keepSignedIn: true, biometricEnabled: true } });
    expect(await service.getBiometricLoginState()).toEqual({
      showSetupCheckbox: false,
      showLoginButton: true,
    });
  });

  it('"Ingat saya" tanpa biometrik: masih menawarkan setup', async () => {
    const { service } = await setup({ saved: { keepSignedIn: true, biometricEnabled: false } });
    expect((await service.getBiometricLoginState()).showSetupCheckbox).toBe(true);
  });
});

describe('LaunchService.signInWithBiometric', () => {
  it('berhasil: sesi dipulihkan', async () => {
    const { service, session } = await setup({
      saved: { keepSignedIn: true, biometricEnabled: true },
    });
    expect(await service.signInWithBiometric()).toEqual({ ok: true });
    expect(session.token).toBe('jwt');
  });

  it('dibatalkan pengguna: tanpa pesan error', async () => {
    const { service } = await setup({
      saved: { keepSignedIn: true, biometricEnabled: true },
      result: { ok: false, cancelled: true, message: 'Gunakan Password' },
    });
    expect(await service.signInWithBiometric()).toEqual({ ok: false, message: null });
  });

  it('gagal sungguhan: pesan dari perangkat ditampilkan', async () => {
    const { service } = await setup({
      saved: { keepSignedIn: true, biometricEnabled: true },
      result: { ok: false, cancelled: false, message: 'Terlalu banyak percobaan' },
    });
    expect(await service.signInWithBiometric()).toEqual({
      ok: false,
      message: 'Terlalu banyak percobaan',
    });
  });

  it('biometrik lolos tetapi sesi tersimpan tidak ada: pesan jelas, tidak login', async () => {
    const { service, session } = await setup({});
    const result = await service.signInWithBiometric();
    expect(result.ok).toBe(false);
    expect(session.isLoggedIn()).toBe(false);
  });
});
