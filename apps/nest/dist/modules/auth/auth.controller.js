var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Query, Req, Res, UseGuards, } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { fromNodeHeaders } from 'better-auth/node';
import { z } from 'zod';
import { CurrentSession } from '../../common/decorators/current-session.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AuthRateLimitGuard } from '../../common/guards/rate-limit.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { changePasswordSchema, checkEmailQuerySchema, loginSchema, registerSchema, sessionIdParamSchema, } from './auth.schemas.js';
import { AuthService } from './auth.service.js';
const bodyDoc = (schema) => ({ schema: z.toJSONSchema(schema) });
function applyCookies(res, cookies) {
    for (const cookie of cookies)
        res.append('Set-Cookie', cookie);
}
function authBody(result, message, isMobile) {
    return {
        success: true,
        message,
        userId: result.user.id,
        fullName: result.user.name,
        avatarUrl: result.user.image,
        user: result.user,
        ...(isMobile && result.token ? { token: result.token } : {}),
    };
}
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(body, req, res) {
        const result = await this.authService.register(body, fromNodeHeaders(req.headers));
        applyCookies(res, result.setCookies);
        return authBody(result, 'Registrasi berhasil', body.clientType === 'mobile');
    }
    async checkEmail(query) {
        const registered = await this.authService.isEmailRegistered(query.email);
        return { success: true, email: query.email.toLowerCase(), available: !registered };
    }
    async login(body, req, res) {
        const result = await this.authService.login(body, fromNodeHeaders(req.headers));
        applyCookies(res, result.setCookies);
        const isMobile = body.clientType === 'mobile' || !!body.isMobileClient;
        return authBody(result, 'Login berhasil', isMobile);
    }
    async logout(req, res) {
        const cookies = await this.authService.logout(fromNodeHeaders(req.headers));
        applyCookies(res, cookies);
        return { success: true, message: 'Logout berhasil' };
    }
    me(current) {
        const { token: _token, ...session } = current.session;
        return { success: true, data: { user: current.user, session } };
    }
    async changePassword(body, req, res) {
        const result = await this.authService.changePassword(body, fromNodeHeaders(req.headers));
        applyCookies(res, result.setCookies);
        return { success: true, message: 'Password berhasil diganti' };
    }
    async sessions(req) {
        const data = await this.authService.listSessions(fromNodeHeaders(req.headers));
        return { success: true, data };
    }
    async revokeOthers(req) {
        await this.authService.revokeOtherSessions(fromNodeHeaders(req.headers));
        return { success: true, message: 'Sesi lain berhasil dicabut' };
    }
    async revokeOne(id, req) {
        await this.authService.revokeSession(id, fromNodeHeaders(req.headers));
        return { success: true, message: 'Sesi berhasil dicabut' };
    }
};
__decorate([
    Post('register'),
    HttpCode(201),
    UseGuards(AuthRateLimitGuard),
    ApiOperation({
        summary: 'Registrasi pengguna baru',
        description: 'Sesi langsung dibuat: web menerima cookie, mobile menerima token.',
    }),
    ApiBody(bodyDoc(registerSchema)),
    ApiResponse({ status: 201, description: 'Registrasi berhasil' }),
    ApiResponse({ status: 400, description: 'Validasi gagal' }),
    ApiResponse({ status: 409, description: 'Email sudah terdaftar' }),
    __param(0, Body(new ZodValidationPipe(registerSchema))),
    __param(1, Req()),
    __param(2, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    Get('check-email'),
    ApiOperation({ summary: 'Cek ketersediaan email' }),
    ApiQuery({ name: 'email', required: true }),
    ApiResponse({ status: 200, description: 'Hasil pengecekan' }),
    __param(0, Query(new ZodValidationPipe(checkEmailQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkEmail", null);
__decorate([
    Post('login'),
    HttpCode(200),
    UseGuards(AuthRateLimitGuard),
    ApiOperation({ summary: 'Login email & password' }),
    ApiBody(bodyDoc(loginSchema)),
    ApiResponse({ status: 200, description: 'Login berhasil' }),
    ApiResponse({ status: 401, description: 'Email atau password salah' }),
    __param(0, Body(new ZodValidationPipe(loginSchema))),
    __param(1, Req()),
    __param(2, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    Post('logout'),
    HttpCode(200),
    ApiOperation({ summary: 'Logout (hapus sesi aktif)' }),
    ApiResponse({ status: 200, description: 'Logout berhasil' }),
    __param(0, Req()),
    __param(1, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    Get('me'),
    UseGuards(AuthGuard),
    ApiOperation({
        summary: 'Sesi aktif / profil user',
        description: 'Token sesi sengaja tidak disertakan agar tidak bocor lewat XSS.',
    }),
    ApiResponse({ status: 200, description: 'Data sesi berhasil didapatkan' }),
    ApiResponse({ status: 401, description: 'Belum login' }),
    __param(0, CurrentSession()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    Post('change-password'),
    HttpCode(200),
    UseGuards(AuthRateLimitGuard, AuthGuard),
    ApiOperation({ summary: 'Ganti password (wajib login)' }),
    ApiBody(bodyDoc(changePasswordSchema)),
    ApiResponse({ status: 200, description: 'Password berhasil diganti' }),
    ApiResponse({ status: 401, description: 'Belum login / password saat ini salah' }),
    __param(0, Body(new ZodValidationPipe(changePasswordSchema))),
    __param(1, Req()),
    __param(2, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    Get('sessions'),
    UseGuards(AuthGuard),
    ApiOperation({ summary: 'Daftar sesi/perangkat aktif' }),
    ApiResponse({ status: 200, description: 'Daftar sesi aktif' }),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sessions", null);
__decorate([
    Delete('sessions'),
    UseGuards(AuthGuard),
    ApiOperation({ summary: 'Cabut semua sesi lain (sesi ini tetap aktif)' }),
    ApiResponse({ status: 200, description: 'Sesi lain dicabut' }),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeOthers", null);
__decorate([
    Delete('sessions/:id'),
    UseGuards(AuthGuard),
    ApiOperation({ summary: 'Cabut satu sesi berdasarkan id' }),
    ApiResponse({ status: 200, description: 'Sesi dicabut' }),
    ApiResponse({ status: 404, description: 'Sesi tidak ditemukan' }),
    __param(0, Param('id', new ZodValidationPipe(sessionIdParamSchema))),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeOne", null);
AuthController = __decorate([
    ApiTags('Auth'),
    Controller('auth'),
    __param(0, Inject(AuthService)),
    __metadata("design:paramtypes", [AuthService])
], AuthController);
export { AuthController };
//# sourceMappingURL=auth.controller.js.map