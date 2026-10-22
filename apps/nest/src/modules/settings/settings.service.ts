import { BadRequestException, Injectable } from '@nestjs/common';
import * as path from 'path';
import { AvatarsStorageService } from '../avatars/avatars-storage.service.js';
import { ALLOWED_EXT, ALLOWED_MIME, MAX_AVATAR_SIZE } from './settings.schemas.js';

@Injectable()
export class SettingsService {
    constructor(private readonly avatarStorage: AvatarsStorageService) { }

    private validateAvatarFile(file: {
        size: number;
        mimetype: string;
        originalname: string;
        buffer: Buffer;
    }) {
        if (!file) {
            throw new BadRequestException({
                success: false,
                message: "No file uploaded. Ensure the form-data key is named 'file' or 'avatar'.",
            });
        }
        if (file.size > MAX_AVATAR_SIZE) {
            throw new BadRequestException({
                success: false,
                message: `Ukuran file maksimal ${MAX_AVATAR_SIZE / 1024 / 1024}MB`,
            });
        }
        if (!(ALLOWED_MIME as readonly string[]).includes(file.mimetype)) {
            throw new BadRequestException({
                success: false,
                message: `Tipe file tidak didukung. Allowed: ${ALLOWED_MIME.join(', ')}`,
            });
        }
        const ext = path.extname(file.originalname).toLowerCase();
        if (!(ALLOWED_EXT as readonly string[]).includes(ext)) {
            throw new BadRequestException({
                success: false,
                message: `Ekstensi file tidak didukung. Allowed: ${ALLOWED_EXT.join(', ')}`,
            });
        }
    }

    async uploadAvatar(userId: string, file: {
        size: number;
        mimetype: string;
        originalname: string;
        buffer: Buffer;
    }) {
        this.validateAvatarFile(file);

        // pakai getter yang sudah ada di service kamu
        const storageConfig = this.avatarStorage as unknown as {
            isConfigured?: boolean;
            IsConfigured?: boolean;
        };
        const configured = storageConfig.isConfigured ?? storageConfig.IsConfigured;
        if (!configured) {
            throw new BadRequestException({
                success: false,
                message: 'Neon bucket belum dikonfigurasi di server.',
            });
        }

        // pakai method buildFileName kalau ada di service existing, kalau tidak pakai logic ini
        const storageWithBuilder = this.avatarStorage as AvatarsStorageService & {
            buildFileName?: (userId: string, originalname: string) => string;
        };
        const fileName = storageWithBuilder.buildFileName
            ? storageWithBuilder.buildFileName(userId, file.originalname)
            : `avatar_${userId}_${Date.now()}${path.extname(file.originalname).toLowerCase()}`;

        const storageWithUploader = this.avatarStorage as AvatarsStorageService & {
            uploadAvatarAsync: (fileName: string, buffer: Buffer, mimetype: string) => Promise<string>;
        };
        const publicUrl = await storageWithUploader.uploadAvatarAsync(
            fileName,
            file.buffer,
            file.mimetype,
        );

        return { avatarUrl: publicUrl, fileName };
    }
}