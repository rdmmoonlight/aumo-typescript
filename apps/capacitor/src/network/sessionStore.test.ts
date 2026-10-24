import { describe, expect, it } from 'vitest';
import { Session } from './session';
import { SessionStore } from './sessionStore';
import type { KeyValueStore } from './sessionStore';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
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

const params = { token: 'jwt-token', userId: 'u1', fullName: 'Ghofur', biometricEnabled: false };

describe('SessionStore', () => {
  it('tanpa "Ingat saya": tidak menyimpan apa pun dan menghapus sisa sesi lama', async () => {
    const kv = memoryStore();
    const store = new SessionStore(kv);
    await store.save({ ...params, keepSignedIn: true });
    expect(await store.hasSavedSession()).toBe(true);

    await store.save({ ...params, keepSignedIn: false });
    expect(kv.data.size).toBe(0);
    expect(await store.hasSavedSession()).toBe(false);
  });

  it('menyimpan lalu memulihkan sesi ke Session', async () => {
    const store = new SessionStore(memoryStore());
    await store.save({ ...params, keepSignedIn: true, biometricEnabled: true });

    const session = new Session();
    expect(await store.restoreInto(session)).toBe(true);
    expect(session.isLoggedIn()).toBe(true);
    expect(session.token).toBe('jwt-token');
    expect(session.userId).toBe('u1');
    expect(session.fullName).toBe('Ghofur');
    expect(await store.isBiometricEnabled()).toBe(true);
  });

  it('tanpa sesi tersimpan: restoreInto mengembalikan false dan Session tetap kosong', async () => {
    const store = new SessionStore(memoryStore());
    const session = new Session();
    expect(await store.restoreInto(session)).toBe(false);
    expect(session.isLoggedIn()).toBe(false);
  });

  it('clear menghapus semuanya (logout)', async () => {
    const store = new SessionStore(memoryStore());
    await store.save({ ...params, keepSignedIn: true, biometricEnabled: true });
    await store.clear();
    expect(await store.hasSavedSession()).toBe(false);
    expect(await store.isBiometricEnabled()).toBe(false);
  });

  it('token kosong dianggap tidak ada sesi', async () => {
    const kv = memoryStore();
    kv.data.set('keep_signed_in', 'true');
    kv.data.set('auth_token', '  ');
    expect(await new SessionStore(kv).hasSavedSession()).toBe(false);
  });
});

describe('Session', () => {
  it('isLoggedIn dan clear', () => {
    const session = new Session();
    expect(session.isLoggedIn()).toBe(false);
    session.set({ token: 't', userId: 'u', fullName: 'n' });
    expect(session.isLoggedIn()).toBe(true);
    session.clear();
    expect(session.isLoggedIn()).toBe(false);
    expect(session.token).toBeNull();
  });
});
