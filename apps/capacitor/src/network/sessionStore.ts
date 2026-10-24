import type { Session } from './session';

/** Penyimpanan key-value string. Implementasi nyata: secureKeyValueStore. */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  clear(): Promise<void>;
}

const KEY_TOKEN = 'auth_token';
const KEY_USER_ID = 'user_id';
const KEY_FULL_NAME = 'full_name';
const KEY_KEEP_SIGNED_IN = 'keep_signed_in';
const KEY_BIOMETRIC_ENABLED = 'biometric_enabled';

/**
 * Penyimpanan sesi terenkripsi untuk fitur "Ingat saya" dan biometrik
 * (padanan SessionStore.kt). Session (memori) tetap sumber kebenaran selama app
 * berjalan; store ini dibaca sekali saat start untuk memulihkan sesi.
 *
 * Catatan keamanan: biometrik hanya menjadi GERBANG sebelum sesi dipulihkan,
 * belum mengikat token secara kriptografis ke sensor (utang teknis yang sama
 * dengan versi Kotlin).
 */
export class SessionStore {
  private readonly store: KeyValueStore;

  constructor(store: KeyValueStore) {
    this.store = store;
  }

  /** keepSignedIn = false: tidak menyimpan apa pun dan menghapus sisa sesi lama. */
  async save(params: {
    token: string;
    userId: string;
    fullName: string;
    keepSignedIn: boolean;
    biometricEnabled: boolean;
  }): Promise<void> {
    if (!params.keepSignedIn) {
      await this.clear();
      return;
    }
    await this.store.set(KEY_TOKEN, params.token);
    await this.store.set(KEY_USER_ID, params.userId);
    await this.store.set(KEY_FULL_NAME, params.fullName);
    await this.store.set(KEY_KEEP_SIGNED_IN, 'true');
    await this.store.set(KEY_BIOMETRIC_ENABLED, String(params.biometricEnabled));
  }

  async hasSavedSession(): Promise<boolean> {
    const keep = await this.store.get(KEY_KEEP_SIGNED_IN);
    const token = await this.store.get(KEY_TOKEN);
    return keep === 'true' && token !== null && token.trim() !== '';
  }

  async isBiometricEnabled(): Promise<boolean> {
    return (await this.store.get(KEY_BIOMETRIC_ENABLED)) === 'true';
  }

  /** Pulihkan token tersimpan ke Session. Mengembalikan false bila tidak ada sesi. */
  async restoreInto(session: Session): Promise<boolean> {
    if (!(await this.hasSavedSession())) return false;
    const token = await this.store.get(KEY_TOKEN);
    if (token === null) return false;
    session.set({
      token,
      userId: await this.store.get(KEY_USER_ID),
      fullName: await this.store.get(KEY_FULL_NAME),
    });
    return true;
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }
}
