import { describe, expect, it } from 'vitest';
import { changePasswordSchema, loginSchema, registerSchema } from '../modules/auth/auth.schemas.js';

describe('Skema validasi auth', () => {
  it('registerSchema: email & password min 8 karakter', () => {
    expect(registerSchema.safeParse({ email: 'a@b.com', password: '12345678' }).success).toBe(true);
    expect(registerSchema.safeParse({ email: 'a@b.com', password: '1234567' }).success).toBe(false);
    expect(registerSchema.safeParse({ email: 'salah', password: '12345678' }).success).toBe(false);
    expect(
      registerSchema.safeParse({ email: 'a@b.com', password: '12345678', clientType: 'tv' }).success
    ).toBe(false);
  });

  it('loginSchema: password wajib terisi, rememberMe opsional boolean', () => {
    expect(
      loginSchema.safeParse({ email: 'a@b.com', password: 'x', rememberMe: true }).success
    ).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email: 'a@b.com', password: 'x', rememberMe: 'ya' }).success
    ).toBe(false);
  });

  it('changePasswordSchema: password baru min 8 karakter', () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: 'a', newPassword: '12345678' }).success
    ).toBe(true);
    expect(
      changePasswordSchema.safeParse({ currentPassword: 'a', newPassword: '123' }).success
    ).toBe(false);
    expect(changePasswordSchema.safeParse({ newPassword: '12345678' }).success).toBe(false);
  });
});
