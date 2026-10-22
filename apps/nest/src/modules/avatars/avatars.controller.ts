import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { AvatarsService } from './avatars.service.js';

@Controller('avatars')
export class AvatarsController {
    constructor(private readonly avatarsService: AvatarsService) { }

    @Get(':fileName')
    @Public()
    async get(
        @Param('fileName') fileName: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const avatar = await this.avatarsService.getAvatarFile(fileName);

        // Mengatur header sesuai perilaku .NET controller
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Type', avatar.contentType);

        return new StreamableFile(avatar.stream);
    }
}