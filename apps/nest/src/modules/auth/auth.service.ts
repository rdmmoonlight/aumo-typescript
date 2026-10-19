import { Injectable } from '@nestjs/common';
import { APIError } from 'better-auth/api';
import { auth } from '../../lib/auth.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import type {
  ActiveSession,
  AuthResult,
  AuthSessionDto,
  AuthUserDto,
  ChangePasswordRequest,
  LoginRequest,
  RawUser,
  RegisterDTO,
} from '../../types/auth.js';

const toUserDto = (u: RawUser): AuthUserDto => ({
  id: u.id,
  name: u.name,
  email: u.email,
  emailVerified: u.emailVerified,
  image: u.image ?? null,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

// Type untuk baris session dari better-auth, biar gak pakai any
type BetterAuthSessionRow = {
  id: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  expiresAt: Date;
};

/** Menerjemahkan error Better Auth menjadi AppError agar response API konsisten. */
export function mapAuthError(err: unknown, fallbackMessage: string): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof APIError) {
    const body = err.body as { code?: string; message?: string } | undefined;
    const code = String(body?.code ?? '');
    const message = body?.message ?? fallbackMessage;

    if (code.startsWith('USER_ALREADY_EXISTS')) {
      return new AppError('Email sudah terdaftar', 409);
    }
    if (code === 'INVALID_EMAIL_OR_PASSWORD' || code === 'INVALID_PASSWORD') {
      return new AppError('Email atau password salah', 401);
    }
    if (err.statusCode === 401 || err.statusCode === 403) return new AppError(message, 401);
    if (err.statusCode === 404) return new AppError(message, 404);
    if (err.statusCode >= 400 && err.statusCode < 500) return new AppError(message, 400);
  }

  logger.error({ err }, fallbackMessage);
  return new AppError(fallbackMessage, 500);
}

@Injectable()
export class AuthService {
  /** Sesi user aktif dari header request (cookie atau Bearer). */
  async getSession(headers: Headers): Promise<ActiveSession | null> {
    return (await auth.api.getSession({ headers })) as ActiveSession | null;
  }

  /** Cek apakah email sudah dipakai. */
  async isEmailRegistered(email: string): Promise<boolean> {
    try {
      const ctx = await auth.$context;
      const user = await ctx.internalAdapter.findUserByEmail(normalizeEmail(email));
      return !!user;
    } catch (err: unknown) {
      throw mapAuthError(err, 'Gagal memeriksa email');
    }
  }

  /** Registrasi (email & password). Nama kosong -> bagian lokal email. Sesi langsung dibuat. */
  async register(data: RegisterDTO, headers: Headers): Promise<AuthResult> {
    const email = normalizeEmail(data.email);
    const name = data.name?.trim() || email.split('@')[0];

    try {
      const { headers: resHeaders, response } = await auth.api.signUpEmail({
        body: { name, email, password: data.password },
        headers,
        returnHeaders: true,
      });

      return {
        user: toUserDto(response.user as RawUser),
        token: response.token ?? null,
        setCookies: resHeaders.getSetCookie(),
      };
    } catch (err: unknown) {
      throw mapAuthError(err, 'Registrasi gagal');
    }
  }

  /** Login dengan email & password. */
  async login(data: LoginRequest, headers: Headers): Promise<AuthResult> {
    try {
      const { headers: resHeaders, response } = await auth.api.signInEmail({
        body: {
          email: normalizeEmail(data.email),
          password: data.password,
          rememberMe: data.rememberMe,
        },
        headers,
        returnHeaders: true,
      });

      return {
        user: toUserDto(response.user as RawUser),
        token: response.token ?? null,
        setCookies: resHeaders.getSetCookie(),
      };
    } catch (err: unknown) {
      throw mapAuthError(err, 'Login gagal');
    }
  }

  /** Logout: hapus sesi aktif, kembalikan header penghapus cookie. */
  async logout(headers: Headers): Promise<string[]> {
    try {
      const { headers: resHeaders } = await auth.api.signOut({ headers, returnHeaders: true });
      return resHeaders.getSetCookie();
    } catch (err: unknown) {
      throw mapAuthError(err, 'Logout gagal');
    }
  }

  /** Ganti password (wajib login). Opsional mencabut sesi di perangkat lain. */
  async changePassword(data: ChangePasswordRequest, headers: Headers): Promise<AuthResult> {
    try {
      const { headers: resHeaders, response } = await auth.api.changePassword({
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          revokeOtherSessions: data.revokeOtherSessions,
        },
        headers,
        returnHeaders: true,
      });

      return {
        user: toUserDto(response.user as RawUser),
        token: response.token ?? null,
        setCookies: resHeaders.getSetCookie(),
      };
    } catch (err: unknown) {
      throw mapAuthError(err, 'Gagal mengganti password');
    }
  }

  /** Daftar sesi aktif milik user. */
  async listSessions(headers: Headers): Promise<AuthSessionDto[]> {
    try {
      const current = await auth.api.getSession({ headers });
      if (!current) throw new AppError('Unauthorized: Silakan login terlebih dahulu', 401);

      const rows = (await auth.api.listSessions({ headers })) as BetterAuthSessionRow[];

      return rows.map((s: BetterAuthSessionRow): AuthSessionDto => ({
        id: s.id,
        ipAddress: s.ipAddress ?? null,
        userAgent: s.userAgent ?? null,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === current.session.id,
      }));
    } catch (err: unknown) {
      throw mapAuthError(err, 'Gagal mengambil daftar sesi');
    }
  }

  /** Cabut satu sesi berdasarkan id. */
  async revokeSession(sessionId: string, headers: Headers): Promise<void> {
    try {
      const sessions = (await auth.api.listSessions({ headers })) as BetterAuthSessionRow[];
      const session = sessions.find((item: BetterAuthSessionRow) => item.id === sessionId);
      if (!session) throw new AppError('Sesi tidak ditemukan', 404);

      await auth.api.revokeSession({ body: { token: session.token }, headers });
    } catch (err: unknown) {
      throw mapAuthError(err, 'Gagal mencabut sesi');
    }
  }

  /** Cabut seluruh sesi lain; sesi saat ini tetap aktif. */
  async revokeOtherSessions(headers: Headers): Promise<void> {
    try {
      await auth.api.revokeOtherSessions({ headers });
    } catch (err: unknown) {
      throw mapAuthError(err, 'Gagal mencabut sesi lain');
    }
  }
}
