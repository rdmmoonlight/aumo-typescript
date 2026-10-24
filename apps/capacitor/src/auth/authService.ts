import type { Logger } from '../logging/logger';
import { NetworkError } from '../network/apiClient';
import type { Session } from '../network/session';
import type { SessionStore } from '../network/sessionStore';
import { parseLoginResponse } from './authApi';
import type { AuthApi } from './authApi';

export type SignInResult = { ok: true; fullName: string } | { ok: false; message: string };

export interface SignInParams {
  email: string;
  password: string;
  keepSignedIn: boolean;
  enableBiometric: boolean;
}

interface AuthServiceDeps {
  api: AuthApi;
  session: Session;
  sessionStore: SessionStore;
  logger: Pick<Logger, 'error'>;
}

/** Alur masuk/keluar (padanan LoginViewModel.login dan LogoutActivity). */
export class AuthService {
  private readonly deps: AuthServiceDeps;

  constructor(deps: AuthServiceDeps) {
    this.deps = deps;
  }

  async signIn(params: SignInParams): Promise<SignInResult> {
    const { api, session, sessionStore, logger } = this.deps;
    // Biometrik hanya berguna bila sesi tersimpan, jadi biometrik dianggap meminta "Ingat saya".
    const shouldKeepSignedIn = params.keepSignedIn || params.enableBiometric;
    try {
      const response = await api.login({
        email: params.email,
        password: params.password,
        rememberMe: shouldKeepSignedIn,
      });
      const body = parseLoginResponse(response.data);
      if (response.ok && body?.success && body.token && body.userId && body.fullName) {
        session.set({ token: body.token, userId: body.userId, fullName: body.fullName });
        await sessionStore.save({
          token: body.token,
          userId: body.userId,
          fullName: body.fullName,
          keepSignedIn: shouldKeepSignedIn,
          biometricEnabled: params.enableBiometric,
        });
        return { ok: true, fullName: body.fullName };
      }
      const message = body?.message.trim() ?? '';
      return {
        ok: false,
        message: message !== '' ? message : `Login gagal (${String(response.status)})`,
      };
    } catch (error) {
      logger.error('AuthService', 'Error tertangkap', error);
      const message =
        error instanceof NetworkError || error instanceof Error ? error.message : 'Koneksi gagal';
      return { ok: false, message: message || 'Koneksi gagal' };
    }
  }

  /**
   * JWT stateless: panggilan API hanya formalitas (catatan aktivitas), sesi berakhir
   * saat token dihapus. Fire-and-forget; token dibaca sebelum dihapus.
   */
  async signOut(): Promise<void> {
    const { api, session, sessionStore } = this.deps;
    api.logout().catch(() => undefined);
    session.clear();
    await sessionStore.clear();
  }
}
