import { Injectable, Logger } from '@nestjs/common';
import * as path from 'node:path';
import { AppError, ValidationMessagesError } from '../../lib/errors.js';
import { AvatarsStorageService } from '../avatars/avatars-storage.service.js';
import {
    ALLOWED_EXT,
    ALLOWED_MIME,
    AVATAR_MISSING_MESSAGE,
    AVATAR_SIZE_MESSAGE,
    AVATAR_TYPE_MESSAGE,
    matchesImageSignature,
    MAX_AVATAR_SIZE,
    SAFE_USER_ID,
} from './settings.schemas.js';
import { AvatarUploadResponse } from './settings.types.js';

export interface UploadedAvatar {
    size: number;
    mimetype: string;
    originalname: string;
    buffer: Buffer;
}

@Injectable()
export class SettingsService {
    private readonly logger = new Logger(SettingsService.name);

    constructor(private readonly avatarStorage: AvatarsStorageService) { }

    /** Setara AvatarFileValidator: pesan duplikat dibuang dan dikembalikan sebagai errors[]. */
    private validate(file: UploadedAvatar): string {
        const errors: string[] = [];
        const ext = path.extname(file.originalname).toLowerCase();

        if (file.size > MAX_AVATAR_SIZE) errors.push(AVATAR_SIZE_MESSAGE);
        if (!(ALLOWED_EXT as readonly string[]).includes(ext)) errors.push(AVATAR_TYPE_MESSAGE);
        if (!(ALLOWED_MIME as readonly string[]).includes(file.mimetype.toLowerCase())) {
            errors.push(AVATAR_TYPE_MESSAGE);
        } else if (
            (ALLOWED_EXT as readonly string[]).includes(ext) &&
            file.size <= MAX_AVATAR_SIZE &&
            !matchesImageSignature(file.buffer, ext)
        ) {
            errors.push(AVATAR_TYPE_MESSAGE); // isi berkas tidak sesuai ekstensi yang diklaim
        }

        if (errors.length > 0) throw new ValidationMessagesError([...new Set(errors)]);
        return ext;
    }

    /**
     * Mengunggah avatar dan mengembalikan URL publiknya. Nest tidak menyentuh auth.users (milik Go):
     * klien menyimpan URL ini lewat PUT /settings/profile { avatarUrl }.
     */
    async uploadAvatar(
        userId: string,
        file: UploadedAvatar | undefined,
        publicBaseUrl: string,
    ): Promise<AvatarUploadResponse> {
        if (!SAFE_USER_ID.test(userId ?? '')) {
            throw new AppError('Identitas pengguna tidak valid.', 401);
        }
        if (!file || file.size === 0) throw new AppError(AVATAR_MISSING_MESSAGE, 400);

        const ext = this.validate(file);

        if (!this.avatarStorage.isConfigured) {
            // 5xx disamarkan oleh filter global; penyebab sebenarnya hanya ada di log.
            this.logger.error('Neon bucket belum dikonfigurasi di server.');
            throw new AppError('Neon bucket belum dikonfigurasi di server.', 500);
        }

        const fileName = this.avatarStorage.buildFileName(userId, ext);
        try {
            await this.avatarStorage.uploadAvatar(fileName, file.buffer, file.mimetype.toLowerCase());
        } catch (error) {
            this.logger.error({ err: error }, 'Avatar upload error');
            throw new AppError('Avatar upload error', 500);
        }

        const base = publicBaseUrl.replace(/\/+$/, '');
        return {
            success: true,
            message: 'Avatar uploaded successfully.',
            avatarUrl: `${base}/avatars/${fileName}`,
        };
    }
}
