import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../lib/errors.js';
import { createTestApp } from './helpers/create-test-app.test.js';

const authService = {
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  isEmailRegistered: vi.fn(),
  getSession: vi.fn(),
  changePassword: vi.fn(),
  listSessions: vi.fn(),
  revokeOtherSessions: vi.fn(),
  revokeSession: vi.fn(),
};

const mockUser = {
  id: 'usr-123',
  name: 'John Doe',
  email: 'john@aumo.com',
  emailVerified: true,
  image: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const loggedIn = () =>
  authService.getSession.mockResolvedValue({
    user: mockUser,
    session: {
      id: 'sess-123',
      userId: 'usr-123',
      expiresAt: new Date().toISOString(),
      token: 'secret',
    },
  });

describe('Auth Routes', () => {
  let app: NestExpressApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp(authService as never);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ==================== GET /auth/check-email ====================
  describe('GET /auth/check-email', () => {
    it('available: true jika email belum terdaftar', async () => {
      authService.isEmailRegistered.mockResolvedValue(false);

      const res = await http().get('/auth/check-email?email=User@aumo.com');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, email: 'user@aumo.com', available: true });
      expect(authService.isEmailRegistered).toHaveBeenCalledWith('User@aumo.com');
    });

    it('available: false jika email sudah terdaftar', async () => {
      authService.isEmailRegistered.mockResolvedValue(true);

      const res = await http().get('/auth/check-email?email=user@aumo.com');

      expect(res.body.available).toBe(false);
    });

    it('400 jika format email tidak valid', async () => {
      const res = await http().get('/auth/check-email?email=bukan-email');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validasi gagal');
      expect(res.body.errors.email).toBeDefined();
    });
  });

  // ==================== POST /auth/register ====================
  describe('POST /auth/register', () => {
    const payload = { name: 'John Doe', email: 'john@aumo.com', password: 'Password123!' };

    it('201 tanpa token untuk web, cookie diteruskan', async () => {
      authService.register.mockResolvedValue({
        user: mockUser,
        token: 'abc',
        setCookies: ['session=abc123456; Path=/; HttpOnly'],
      });

      const res = await http()
        .post('/auth/register')
        .send({ ...payload, clientType: 'web' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.userId).toBe('usr-123');
      expect(res.body.token).toBeUndefined();
      expect(res.headers['set-cookie'][0]).toContain('session=abc123456');
    });

    it('201 dengan token untuk mobile', async () => {
      authService.register.mockResolvedValue({
        user: mockUser,
        token: 'mobile-token-xyz',
        setCookies: [],
      });

      const res = await http()
        .post('/auth/register')
        .send({ ...payload, clientType: 'mobile' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBe('mobile-token-xyz');
    });

    it('409 jika email sudah terdaftar', async () => {
      authService.register.mockRejectedValue(new AppError('Email sudah terdaftar', 409));

      const res = await http().post('/auth/register').send(payload);

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ success: false, message: 'Email sudah terdaftar' });
    });

    it('400 jika password kurang dari 8 karakter', async () => {
      const res = await http()
        .post('/auth/register')
        .send({ ...payload, password: '1234567' });

      expect(res.status).toBe(400);
      expect(res.body.errors.password).toContain('Password minimal 8 karakter');
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('400 jika body kosong', async () => {
      const res = await http().post('/auth/register');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validasi gagal');
    });
  });

  // ==================== POST /auth/login ====================
  describe('POST /auth/login', () => {
    const payload = { email: 'john@aumo.com', password: 'Password123!' };

    it('200 dan data user', async () => {
      authService.login.mockResolvedValue({
        user: mockUser,
        token: 'tok',
        setCookies: ['session=token-cookie'],
      });

      const res = await http().post('/auth/login').send(payload);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login berhasil');
      expect(res.body.token).toBeUndefined();
      expect(res.headers['set-cookie'][0]).toContain('session=token-cookie');
    });

    it('menyertakan token jika clientType mobile', async () => {
      authService.login.mockResolvedValue({ user: mockUser, token: 'tok', setCookies: [] });

      const res = await http()
        .post('/auth/login')
        .send({ ...payload, clientType: 'mobile' });

      expect(res.body.token).toBe('tok');
    });

    it('menyertakan token jika isMobileClient true', async () => {
      authService.login.mockResolvedValue({ user: mockUser, token: 'tok', setCookies: [] });

      const res = await http()
        .post('/auth/login')
        .send({ ...payload, isMobileClient: true });

      expect(res.body.token).toBe('tok');
    });

    it('401 jika kredensial salah', async () => {
      authService.login.mockRejectedValue(new AppError('Email atau password salah', 401));

      const res = await http().post('/auth/login').send(payload);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Email atau password salah');
    });

    it('400 jika password kosong', async () => {
      const res = await http().post('/auth/login').send({ email: 'john@aumo.com', password: '' });

      expect(res.status).toBe(400);
    });

    it('500 generik jika service melempar error tak terduga', async () => {
      authService.login.mockRejectedValue(new Error('db down'));

      const res = await http().post('/auth/login').send(payload);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ success: false, message: 'Terjadi kesalahan pada server' });
    });
  });

  // ==================== POST /auth/logout ====================
  describe('POST /auth/logout', () => {
    it('200 dan cookie dihapus', async () => {
      authService.logout.mockResolvedValue(['session=; Max-Age=0']);

      const res = await http().post('/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Logout berhasil' });
      expect(res.headers['set-cookie'][0]).toContain('Max-Age=0');
    });
  });

  // ==================== GET /auth/me ====================
  describe('GET /auth/me', () => {
    it('401 jika belum login', async () => {
      authService.getSession.mockResolvedValue(null);

      const res = await http().get('/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('200 berisi user dan session tanpa token', async () => {
      loggedIn();

      const res = await http().get('/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe('usr-123');
      expect(res.body.data.session.id).toBe('sess-123');
      expect(res.body.data.session.token).toBeUndefined();
    });
  });

  // ==================== POST /auth/change-password ====================
  describe('POST /auth/change-password', () => {
    const payload = { currentPassword: 'lama12345', newPassword: 'baru12345' };

    it('401 jika belum login', async () => {
      authService.getSession.mockResolvedValue(null);

      const res = await http().post('/auth/change-password').send(payload);

      expect(res.status).toBe(401);
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('200 jika berhasil', async () => {
      loggedIn();
      authService.changePassword.mockResolvedValue({ user: mockUser, token: null, setCookies: [] });

      const res = await http().post('/auth/change-password').send(payload);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password berhasil diganti');
    });

    it('400 jika password baru kurang dari 8 karakter', async () => {
      loggedIn();

      const res = await http()
        .post('/auth/change-password')
        .send({ currentPassword: 'lama12345', newPassword: 'pendek' });

      expect(res.status).toBe(400);
      expect(res.body.errors.newPassword).toBeDefined();
    });
  });

  // ==================== /auth/sessions ====================
  describe('Sesi', () => {
    it('GET /auth/sessions - 401 jika belum login', async () => {
      authService.getSession.mockResolvedValue(null);

      const res = await http().get('/auth/sessions');

      expect(res.status).toBe(401);
    });

    it('GET /auth/sessions - daftar sesi', async () => {
      loggedIn();
      authService.listSessions.mockResolvedValue([
        { id: 'sess-123', ipAddress: null, userAgent: null, isCurrent: true },
      ]);

      const res = await http().get('/auth/sessions');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].isCurrent).toBe(true);
    });

    it('DELETE /auth/sessions - cabut sesi lain', async () => {
      loggedIn();
      authService.revokeOtherSessions.mockResolvedValue(undefined);

      const res = await http().delete('/auth/sessions');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Sesi lain berhasil dicabut');
    });

    it('DELETE /auth/sessions/:id - cabut satu sesi', async () => {
      loggedIn();
      authService.revokeSession.mockResolvedValue(undefined);

      const res = await http().delete('/auth/sessions/sess-999');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Sesi berhasil dicabut');
      expect(authService.revokeSession).toHaveBeenCalledWith('sess-999', expect.anything());
    });

    it('DELETE /auth/sessions/:id - 404 jika sesi tidak ada', async () => {
      loggedIn();
      authService.revokeSession.mockRejectedValue(new AppError('Sesi tidak ditemukan', 404));

      const res = await http().delete('/auth/sessions/tidak-ada');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Sesi tidak ditemukan');
    });
  });
});
