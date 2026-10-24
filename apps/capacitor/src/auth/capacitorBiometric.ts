import {
  AndroidBiometryStrength,
  BiometricAuth,
  BiometryErrorType,
} from '@aparajita/capacitor-biometric-auth';
import type { BiometricPort } from './launchService';

// Dibatalkan pengguna/sistem: bukan kegagalan yang perlu ditampilkan sebagai error.
const CANCEL_CODES: ReadonlySet<string> = new Set([
  BiometryErrorType.userCancel,
  BiometryErrorType.userFallback,
  BiometryErrorType.appCancel,
  BiometryErrorType.systemCancel,
]);

function failureFrom(error: unknown): { ok: false; cancelled: boolean; message: string } {
  const code = (error as { code?: unknown } | null)?.code;
  const message =
    error instanceof Error && error.message !== '' ? error.message : 'Biometrik gagal';
  return { ok: false, cancelled: typeof code === 'string' && CANCEL_CODES.has(code), message };
}

/**
 * Biometrik Android lewat BiometricPrompt. Kekuatan "weak" dan tanpa PIN
 * perangkat: setara BiometricHelper.kt (BIOMETRIC_WEAK + "Gunakan Password").
 */
export const capacitorBiometric: BiometricPort = {
  async isAvailable() {
    try {
      return (await BiometricAuth.checkBiometry()).isAvailable;
    } catch {
      return false;
    }
  },
  async authenticate(prompt) {
    try {
      await BiometricAuth.authenticate({
        androidTitle: prompt.title,
        androidSubtitle: prompt.subtitle,
        cancelTitle: 'Gunakan Password',
        allowDeviceCredential: false,
        androidBiometryStrength: AndroidBiometryStrength.weak,
      });
      return { ok: true };
    } catch (error) {
      return failureFrom(error);
    }
  },
};
