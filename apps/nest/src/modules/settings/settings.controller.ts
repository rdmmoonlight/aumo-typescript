import { Controller, Headers, HttpCode, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { SettingsService, UploadedAvatar } from './settings.service.js';
import { AvatarUploadResponse } from './settings.types.js';

/** Batas keras multer sama dengan client_max_body_size nginx; batas 2 MB diperiksa di service (pesan 400 sumber). */
const HARD_LIMIT_BYTES = 10 * 1024 * 1024;

type MulterFile = UploadedAvatar & { fieldname: string };

/** Base URL publik avatar. PUBLIC_API_URL (mis. https://aumo.id/api) diutamakan; selain itu dari header proxy. */
export function publicBaseUrl(request: Request): string {
    const configured = process.env.PUBLIC_API_URL?.trim();
    if (configured) return configured;
    const proto = (request.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim() || request.protocol;
    const host = (request.headers['x-forwarded-host'] as string | undefined)?.split(',')[0]?.trim() || request.get('host');
    return `${proto}://${host}/api`;
}

/** Setara SettingsController.UploadAvatar. Profil, kata sandi, dan hapus akun dilayani Go (services/auth). */
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Post('avatar')
    @HttpCode(200)
    @UseInterceptors(AnyFilesInterceptor({ limits: { fileSize: HARD_LIMIT_BYTES, files: 5 } }))
    uploadAvatar(
        @Headers('x-user-id') userId: string,
        @UploadedFiles() files: MulterFile[] | undefined,
        @Req() request: Request,
    ): Promise<AvatarUploadResponse> {
        // "Flexible binding" sumber: field `file`, lalu `avatar`, lalu berkas pertama.
        const upload =
            files?.find((f) => f.fieldname === 'file') ??
            files?.find((f) => f.fieldname === 'avatar') ??
            files?.[0];
        return this.settingsService.uploadAvatar(userId, upload, publicBaseUrl(request));
    }
}
