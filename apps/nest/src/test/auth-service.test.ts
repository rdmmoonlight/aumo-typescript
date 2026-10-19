import { APIError } from 'better-auth/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '../lib/auth.js';
import { AppError } from '../lib/errors.js';
import { AuthService, mapAuthError } from '../modules/auth/auth.service.js';

const api = vi.mocked(auth.api, true) as unknown as Record<string, ReturnType<typeof vi.fn>>;

const rawUser = {
  id: 'u1',
  name: 'John',
  email: 'john@aumo.com',
  emailVerified: true,
  image: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const headers = new Headers();

const apiError = (status: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'NOT_FOUND', code?: string) =>
  new APIError(status, { message: 'pesan', code });

describe('AuthService', () => {
  const service = new AuthService();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('register', () => {
    it('normalisasi email, nama default dari email, dan kembalikan cookie', async () => {
      api.signUpEmail.mockResolvedValue({
        headers: new Headers({ 'set-cookie': 'a=1' }),
        response: { user: rawUser, token: 'tok' },
      });

      const result = await service.register(
        { email: '  John@Aumo.COM ', password: 'Password123!' },
        headers
      );

      expect(api.signUpEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { name: 'john', email: 'john@aumo.com', password: 'Password123!' },
        })
      );
      expect(result.token).toBe('tok');
      expect(result.user.image).toBeNull();
      expect(result.setCookies).toEqual(['a=1']);
    });

    it('409 jika email sudah terdaftar', async () => {
      api.signUpEmail.mockRejectedValue(
        apiError('BAD_REQUEST', 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL')
      );

      await expect(
        service.register({ email: 'a@b.com', password: 'Password123!' }, headers)
      ).rejects.toMatchObject({ statusCode: 409, message: 'Email sudah terdaftar' });
    });
  });

  describe('login', () => {
    it('berhasil', async () => {
      api.signInEmail.mockResolvedValue({
        headers: new Headers(),
        response: { user: rawUser, token: 'tok' },
      });

      const result = await service.login(
        { email: 'JOHN@aumo.com', password: 'x', rememberMe: true },
        headers
      );

      expect(api.signInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { email: 'john@aumo.com', password: 'x', rememberMe: true },
        })
      );
      expect(result.user.id).toBe('u1');
    });

    it('401 jika email/password salah', async () => {
      api.signInEmail.mockRejectedValue(apiError('UNAUTHORIZED', 'INVALID_EMAIL_OR_PASSWORD'));

      await expect(
        service.login({ email: 'a@b.com', password: 'x' }, headers)
      ).rejects.toMatchObject({ statusCode: 401, message: 'Email atau password salah' });
    });

    it('500 untuk error tak dikenal', async () => {
      api.signInEmail.mockRejectedValue(new Error('boom'));

      await expect(
        service.login({ email: 'a@b.com', password: 'x' }, headers)
      ).rejects.toMatchObject({ statusCode: 500, message: 'Login gagal' });
    });
  });

  describe('logout', () => {
    it('mengembalikan cookie penghapus', async () => {
      api.signOut.mockResolvedValue({ headers: new Headers({ 'set-cookie': 's=; Max-Age=0' }) });

      await expect(service.logout(headers)).resolves.toEqual(['s=; Max-Age=0']);
    });
  });

  describe('changePassword', () => {
    it('meneruskan parameter ke Better Auth', async () => {
      api.changePassword.mockResolvedValue({
        headers: new Headers(),
        response: { user: rawUser, token: null },
      });

      await service.changePassword(
        { currentPassword: 'lama', newPassword: 'baru12345', revokeOtherSessions: true },
        headers
      );

      expect(api.changePassword).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { currentPassword: 'lama', newPassword: 'baru12345', revokeOtherSessions: true },
        })
      );
    });
  });

  describe('listSessions', () => {
    it('menandai sesi aktif sebagai isCurrent', async () => {
      api.getSession.mockResolvedValue({ session: { id: 's1' }, user: rawUser });
      api.listSessions.mockResolvedValue([
        { id: 's1', token: 't1', createdAt: new Date(), expiresAt: new Date() },
        {
          id: 's2',
          token: 't2',
          ipAddress: '1.1.1.1',
          createdAt: new Date(),
          expiresAt: new Date(),
        },
      ]);

      const result = await service.listSessions(headers);

      expect(result.map((s) => [s.id, s.isCurrent])).toEqual([
        ['s1', true],
        ['s2', false],
      ]);
      expect(result[0]).not.toHaveProperty('token');
    });

    it('401 jika tidak ada sesi', async () => {
      api.getSession.mockResolvedValue(null);

      await expect(service.listSessions(headers)).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('revokeSession', () => {
    it('mencabut sesi berdasarkan token milik sesi tersebut', async () => {
      api.listSessions.mockResolvedValue([{ id: 's2', token: 't2' }]);
      api.revokeSession.mockResolvedValue({ status: true });

      await service.revokeSession('s2', headers);

      expect(api.revokeSession).toHaveBeenCalledWith({ body: { token: 't2' }, headers });
    });

    it('404 jika sesi bukan milik user', async () => {
      api.listSessions.mockResolvedValue([{ id: 's1', token: 't1' }]);

      await expect(service.revokeSession('s9', headers)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Sesi tidak ditemukan',
      });
      expect(api.revokeSession).not.toHaveBeenCalled();
    });
  });

  describe('revokeOtherSessions', () => {
    it('memanggil Better Auth', async () => {
      api.revokeOtherSessions.mockResolvedValue({ status: true });

      await service.revokeOtherSessions(headers);

      expect(api.revokeOtherSessions).toHaveBeenCalledWith({ headers });
    });
  });

  describe('isEmailRegistered', () => {
    it('true jika user ditemukan, email dinormalisasi', async () => {
      const ctx = await auth.$context;
      vi.mocked(ctx.internalAdapter.findUserByEmail).mockResolvedValue({ user: rawUser } as never);

      await expect(service.isEmailRegistered(' John@Aumo.com ')).resolves.toBe(true);
      expect(ctx.internalAdapter.findUserByEmail).toHaveBeenCalledWith('john@aumo.com');
    });

    it('false jika user tidak ada', async () => {
      const ctx = await auth.$context;
      vi.mocked(ctx.internalAdapter.findUserByEmail).mockResolvedValue(null);

      await expect(service.isEmailRegistered('x@y.com')).resolves.toBe(false);
    });
  });

  describe('mapAuthError', () => {
    it('AppError dilewatkan apa adanya', () => {
      const err = new AppError('x', 418);
      expect(mapAuthError(err, 'fallback')).toBe(err);
    });

    it('4xx lain dipetakan ke 400, 404 tetap 404', () => {
      expect(mapAuthError(apiError('BAD_REQUEST'), 'f').statusCode).toBe(400);
      expect(mapAuthError(apiError('NOT_FOUND'), 'f').statusCode).toBe(404);
      expect(mapAuthError(apiError('UNAUTHORIZED'), 'f').statusCode).toBe(401);
    });
  });
});
