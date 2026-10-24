import type { Logger } from '../logging/logger';
import type { Session } from '../network/session';
import type { SessionStore } from '../network/sessionStore';

export type BiometricResult = { ok: true } | { ok: false; cancelled: boolean; message: string };

/** Pintu biometrik. Implementasi nyata: capacitorBiometric. */
export interface BiometricPort {
  /** true bila perangkat punya biometrik (setara BIOMETRIC_WEAK) dan sudah terdaftar. */
  isAvailable(): Promise<boolean>;
  authenticate(prompt: { title: string; subtitle: string }): Promise<BiometricResult>;
}

export type StartDestination = '/home' | '/login';

export interface BiometricLoginState {
  /** Kotak centang "Masuk dengan biometrik lain kali" (setup pertama). */
  showSetupCheckbox: boolean;
  /** Tombol "Masuk dengan biometrik" (sesi dan biometrik sudah aktif). */
  showLoginButton: boolean;
}

/** message null = dibatalkan pengguna, tidak perlu menampilkan error. */
export type BiometricSignInResult = { ok: true } | { ok: false; message: string | null };

interface LaunchServiceDeps {
  session: Session;
  sessionStore: SessionStore;
  biometric: BiometricPort;
  logger: Pick<Logger, 'error'>;
}

const PROMPT = {
  title: 'Masuk ke Aumo Finance',
  subtitle: 'Gunakan sidik jari atau wajah Anda',
};

/** Keputusan saat app dibuka dan masuk lewat biometrik (padanan SplashActivity + LoginActivity). */
export class LaunchService {
  private readonly deps: LaunchServiceDeps;

  constructor(deps: LaunchServiceDeps) {
    this.deps = deps;
  }

  /**
   * - tanpa sesi tersimpan -> Login
   * - sesi + biometrik aktif -> minta biometrik; gagal/batal -> Login (sesi TIDAK
   *   dihapus, bisa dicoba lagi dari tombol biometrik di Login)
   * - sesi tanpa biometrik -> pulihkan sesi, langsung Home
   *
   * Bila biometrik aktif tetapi tidak tersedia lagi (sidik jari dihapus dari
   * perangkat), sesi dipulihkan tanpa gerbang: sama dengan SplashActivity.kt.
   */
  async resolveStartDestination(): Promise<StartDestination> {
    const { session, sessionStore, biometric, logger } = this.deps;
    try {
      if (!(await sessionStore.hasSavedSession())) return '/login';
      if ((await sessionStore.isBiometricEnabled()) && (await biometric.isAvailable())) {
        const result = await biometric.authenticate(PROMPT);
        if (!result.ok) return '/login';
      }
      return (await sessionStore.restoreInto(session)) ? '/home' : '/login';
    } catch (error) {
      logger.error('LaunchService', 'Gagal memulihkan sesi saat start', error);
      return '/login';
    }
  }

  async getBiometricLoginState(): Promise<BiometricLoginState> {
    const { sessionStore, biometric, logger } = this.deps;
    const none: BiometricLoginState = { showSetupCheckbox: false, showLoginButton: false };
    try {
      if (!(await biometric.isAvailable())) return none;
      const alreadyEnabled =
        (await sessionStore.isBiometricEnabled()) && (await sessionStore.hasSavedSession());
      return { showSetupCheckbox: !alreadyEnabled, showLoginButton: alreadyEnabled };
    } catch (error) {
      logger.error('LaunchService', 'Gagal memeriksa biometrik', error);
      return none;
    }
  }

  async signInWithBiometric(): Promise<BiometricSignInResult> {
    const { session, sessionStore, biometric, logger } = this.deps;
    try {
      const result = await biometric.authenticate(PROMPT);
      if (!result.ok) return { ok: false, message: result.cancelled ? null : result.message };
      if (!(await sessionStore.restoreInto(session))) {
        return {
          ok: false,
          message: 'Sesi tersimpan tidak ditemukan. Silakan masuk dengan kata sandi.',
        };
      }
      return { ok: true };
    } catch (error) {
      logger.error('LaunchService', 'Masuk biometrik gagal', error);
      return { ok: false, message: 'Biometrik gagal. Silakan masuk dengan kata sandi.' };
    }
  }
}
