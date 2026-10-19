import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { CurrentSession } from '../../common/decorators/current-session.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AuthRateLimitGuard } from '../../common/guards/rate-limit.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { ActiveSession, AuthResult } from '../../types/auth.js';
import {
  changePasswordSchema,
  checkEmailQuerySchema,
  loginSchema,
  registerSchema,
  sessionIdParamSchema,
} from './auth.schemas.js';
import { AuthService } from './auth.service.js';

type RegisterBody = z.infer<typeof registerSchema>;
type LoginBody = z.infer<typeof loginSchema>;
type ChangePasswordBody = z.infer<typeof changePasswordSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bodyDoc = (schema: z.ZodType) => ({ schema: z.toJSONSchema(schema) as any });

/** Teruskan cookie sesi Better Auth ke browser (web). */
function applyCookies(res: Response, cookies: string[]) {
  for (const cookie of cookies) res.append('Set-Cookie', cookie);
}

function authBody(result: AuthResult, message: string, isMobile: boolean) {
  return {
    success: true as const,
    message,
    userId: result.user.id,
    fullName: result.user.name,
    avatarUrl: result.user.image,
    user: result.user,
    // Web memakai cookie httpOnly; token hanya diberikan ke client mobile
    ...(isMobile && result.token ? { token: result.token } : {}),
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @UseGuards(AuthRateLimitGuard)
  @ApiOperation({
    summary: 'Registrasi pengguna baru',
    description: 'Sesi langsung dibuat: web menerima cookie, mobile menerima token.',
  })
  @ApiBody(bodyDoc(registerSchema))
  @ApiResponse({ status: 201, description: 'Registrasi berhasil' })
  @ApiResponse({ status: 400, description: 'Validasi gagal' })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar' })
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterBody,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.register(body, fromNodeHeaders(req.headers));
    applyCookies(res, result.setCookies);
    return authBody(result, 'Registrasi berhasil', body.clientType === 'mobile');
  }

  @Get('check-email')
  @ApiOperation({ summary: 'Cek ketersediaan email' })
  @ApiQuery({ name: 'email', required: true })
  @ApiResponse({ status: 200, description: 'Hasil pengecekan' })
  async checkEmail(@Query(new ZodValidationPipe(checkEmailQuerySchema)) query: { email: string }) {
    const registered = await this.authService.isEmailRegistered(query.email);
    return { success: true as const, email: query.email.toLowerCase(), available: !registered };
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(AuthRateLimitGuard)
  @ApiOperation({ summary: 'Login email & password' })
  @ApiBody(bodyDoc(loginSchema))
  @ApiResponse({ status: 200, description: 'Login berhasil' })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginBody,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(body, fromNodeHeaders(req.headers));
    applyCookies(res, result.setCookies);
    const isMobile = body.clientType === 'mobile' || !!body.isMobileClient;
    return authBody(result, 'Login berhasil', isMobile);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout (hapus sesi aktif)' })
  @ApiResponse({ status: 200, description: 'Logout berhasil' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = await this.authService.logout(fromNodeHeaders(req.headers));
    applyCookies(res, cookies);
    return { success: true as const, message: 'Logout berhasil' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Sesi aktif / profil user',
    description: 'Token sesi sengaja tidak disertakan agar tidak bocor lewat XSS.',
  })
  @ApiResponse({ status: 200, description: 'Data sesi berhasil didapatkan' })
  @ApiResponse({ status: 401, description: 'Belum login' })
  me(@CurrentSession() current: ActiveSession) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token: _token, ...session } = current.session as ActiveSession['session'] & {
      token?: string;
    };
    return { success: true as const, data: { user: current.user, session } };
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(AuthRateLimitGuard, AuthGuard)
  @ApiOperation({ summary: 'Ganti password (wajib login)' })
  @ApiBody(bodyDoc(changePasswordSchema))
  @ApiResponse({ status: 200, description: 'Password berhasil diganti' })
  @ApiResponse({ status: 401, description: 'Belum login / password saat ini salah' })
  async changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordBody,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.changePassword(body, fromNodeHeaders(req.headers));
    applyCookies(res, result.setCookies);
    return { success: true as const, message: 'Password berhasil diganti' };
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Daftar sesi/perangkat aktif' })
  @ApiResponse({ status: 200, description: 'Daftar sesi aktif' })
  async sessions(@Req() req: Request) {
    const data = await this.authService.listSessions(fromNodeHeaders(req.headers));
    return { success: true as const, data };
  }

  @Delete('sessions')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Cabut semua sesi lain (sesi ini tetap aktif)' })
  @ApiResponse({ status: 200, description: 'Sesi lain dicabut' })
  async revokeOthers(@Req() req: Request) {
    await this.authService.revokeOtherSessions(fromNodeHeaders(req.headers));
    return { success: true as const, message: 'Sesi lain berhasil dicabut' };
  }

  @Delete('sessions/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Cabut satu sesi berdasarkan id' })
  @ApiResponse({ status: 200, description: 'Sesi dicabut' })
  @ApiResponse({ status: 404, description: 'Sesi tidak ditemukan' })
  async revokeOne(
    @Param('id', new ZodValidationPipe(sessionIdParamSchema)) id: string,
    @Req() req: Request
  ) {
    await this.authService.revokeSession(id, fromNodeHeaders(req.headers));
    return { success: true as const, message: 'Sesi berhasil dicabut' };
  }
}
