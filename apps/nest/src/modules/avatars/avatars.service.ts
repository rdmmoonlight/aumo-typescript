import { Injectable, NotFoundException } from '@nestjs/common';
import { AvatarsStorageService } from './avatars-storage.service.js';
import { AvatarFile } from './avatars.types.js';

@Injectable()
export class AvatarsService {
    constructor(private readonly storageService: AvatarsStorageService) { }

    async getAvatarFile(fileName: string): Promise<AvatarFile> {
        if (!this.storageService.isConfigured) {
            throw new NotFoundException('Storage avatar belum dikonfigurasi');
        }

        const avatar = await this.storageService.getAvatar(fileName);
        if (!avatar) {
            throw new NotFoundException('Avatar tidak ditemukan');
        }

        return avatar;
    }
}