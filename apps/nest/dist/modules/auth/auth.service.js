var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { APIError } from 'better-auth/api';
import { auth } from '../../lib/auth.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
const toUserDto = (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    image: u.image ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
});
const normalizeEmail = (email) => email.trim().toLowerCase();
export function mapAuthError(err, fallbackMessage) {
    if (err instanceof AppError)
        return err;
    if (err instanceof APIError) {
        const body = err.body;
        const code = String(body?.code ?? '');
        const message = body?.message ?? fallbackMessage;
        if (code.startsWith('USER_ALREADY_EXISTS')) {
            return new AppError('Email sudah terdaftar', 409);
        }
        if (code === 'INVALID_EMAIL_OR_PASSWORD' || code === 'INVALID_PASSWORD') {
            return new AppError('Email atau password salah', 401);
        }
        if (err.statusCode === 401 || err.statusCode === 403)
            return new AppError(message, 401);
        if (err.statusCode === 404)
            return new AppError(message, 404);
        if (err.statusCode >= 400 && err.statusCode < 500)
            return new AppError(message, 400);
    }
    logger.error({ err }, fallbackMessage);
    return new AppError(fallbackMessage, 500);
}
let AuthService = class AuthService {
    async getSession(headers) {
        return (await auth.api.getSession({ headers }));
    }
    async isEmailRegistered(email) {
        try {
            const ctx = await auth.$context;
            const user = await ctx.internalAdapter.findUserByEmail(normalizeEmail(email));
            return !!user;
        }
        catch (err) {
            throw mapAuthError(err, 'Gagal memeriksa email');
        }
    }
    async register(data, headers) {
        const email = normalizeEmail(data.email);
        const name = data.name?.trim() || email.split('@')[0];
        try {
            const { headers: resHeaders, response } = await auth.api.signUpEmail({
                body: { name, email, password: data.password },
                headers,
                returnHeaders: true,
            });
            return {
                user: toUserDto(response.user),
                token: response.token ?? null,
                setCookies: resHeaders.getSetCookie(),
            };
        }
        catch (err) {
            throw mapAuthError(err, 'Registrasi gagal');
        }
    }
    async login(data, headers) {
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
                user: toUserDto(response.user),
                token: response.token ?? null,
                setCookies: resHeaders.getSetCookie(),
            };
        }
        catch (err) {
            throw mapAuthError(err, 'Login gagal');
        }
    }
    async logout(headers) {
        try {
            const { headers: resHeaders } = await auth.api.signOut({ headers, returnHeaders: true });
            return resHeaders.getSetCookie();
        }
        catch (err) {
            throw mapAuthError(err, 'Logout gagal');
        }
    }
    async changePassword(data, headers) {
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
                user: toUserDto(response.user),
                token: response.token ?? null,
                setCookies: resHeaders.getSetCookie(),
            };
        }
        catch (err) {
            throw mapAuthError(err, 'Gagal mengganti password');
        }
    }
    async listSessions(headers) {
        try {
            const current = await auth.api.getSession({ headers });
            if (!current)
                throw new AppError('Unauthorized: Silakan login terlebih dahulu', 401);
            const rows = (await auth.api.listSessions({ headers }));
            return rows.map((s) => ({
                id: s.id,
                ipAddress: s.ipAddress ?? null,
                userAgent: s.userAgent ?? null,
                createdAt: s.createdAt,
                expiresAt: s.expiresAt,
                isCurrent: s.id === current.session.id,
            }));
        }
        catch (err) {
            throw mapAuthError(err, 'Gagal mengambil daftar sesi');
        }
    }
    async revokeSession(sessionId, headers) {
        try {
            const sessions = (await auth.api.listSessions({ headers }));
            const session = sessions.find((item) => item.id === sessionId);
            if (!session)
                throw new AppError('Sesi tidak ditemukan', 404);
            await auth.api.revokeSession({ body: { token: session.token }, headers });
        }
        catch (err) {
            throw mapAuthError(err, 'Gagal mencabut sesi');
        }
    }
    async revokeOtherSessions(headers) {
        try {
            await auth.api.revokeOtherSessions({ headers });
        }
        catch (err) {
            throw mapAuthError(err, 'Gagal mencabut sesi lain');
        }
    }
};
AuthService = __decorate([
    Injectable()
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map