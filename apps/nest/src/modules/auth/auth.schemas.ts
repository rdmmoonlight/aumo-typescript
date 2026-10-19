import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(8, { message: 'Password minimal 8 karakter' }),
  clientType: z.enum(['web', 'mobile']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong' }),
  rememberMe: z.boolean().optional(),
  clientType: z.enum(['web', 'mobile']).optional(),
  isMobileClient: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Password saat ini wajib diisi' }),
  newPassword: z.string().min(8, { message: 'Password baru minimal 8 karakter' }),
  revokeOtherSessions: z.boolean().optional(),
});

export const checkEmailQuerySchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
});

export const sessionIdParamSchema = z.string().min(1, { message: 'ID sesi wajib diisi' });
