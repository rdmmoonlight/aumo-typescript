import type { Request } from 'express';

// ==========================================
// Request DTO
// ==========================================
export interface RegisterDTO {
  email: string;
  password: string;
  name?: string;
  clientType?: 'web' | 'mobile';
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  clientType?: 'web' | 'mobile';
  isMobileClient?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}

// ==========================================
// Auth (Better Auth) - sesuai tabel user/session/account
// ==========================================
export type RawUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

/** Kolom tabel "user" yang aman dikirim ke client */
export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/** Kolom tabel "session" (tanpa token) untuk daftar perangkat aktif */
export interface AuthSessionDto {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | Date;
  expiresAt: string | Date;
  isCurrent: boolean;
}

/** Hasil operasi auth: data + header Set-Cookie dari Better Auth (untuk web). */
export interface AuthResult {
  user: AuthUserDto;
  /** Token sesi (hanya diteruskan ke client mobile). */
  token: string | null;
  setCookies: string[];
}

/** Data sesi aktif yang ditempel AuthGuard ke request. */
export interface ActiveSession {
  user: AuthUserDto & Record<string, unknown>;
  session: { id: string; userId: string; expiresAt: string | Date } & Record<string, unknown>;
}

export type AuthenticatedRequest = Request & { authSession?: ActiveSession };
