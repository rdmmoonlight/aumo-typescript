import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import type { KeyValueStore } from './sessionStore';

/**
 * Penyimpanan terenkripsi berbasis Android Keystore. Di web (mode dev) plugin
 * jatuh balik ke localStorage tanpa enkripsi. Jangan pakai @capacitor/preferences
 * untuk token: tidak terenkripsi.
 */
export const secureKeyValueStore: KeyValueStore = {
  get: (key) => SecureStorage.getItem(key),
  set: (key, value) => SecureStorage.setItem(key, value),
  async clear() {
    await SecureStorage.clear();
  },
};
