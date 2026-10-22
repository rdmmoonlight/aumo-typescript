import {
    BadRequestException,
    Controller,
    Headers,
    Post,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { SettingsService } from './settings.service.js';
import { AvatarResponse } from './settings.types.js';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Post('avatar')
    @UseInterceptors(AnyFilesInterceptor({ limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
    async uploadAvatar(
        @Headers('x-user-id') userId: string,
        @UploadedFiles() files: (Parameters<SettingsService['uploadAvatar']>[1] & { fieldname: string })[],
    ): Promise<AvatarResponse> {
        const uploadFile =
            files?.find((f) => f.fieldname === 'file') ??
            files?.find((f) => f.fieldname === 'avatar') ??
            files?.[0];

        if (!uploadFile) {
            throw new BadRequestException({
                success: false,
                message: "No file uploaded. Ensure the form-data key is named 'file' or 'avatar'.",
            });
        }

        const data = await this.settingsService.uploadAvatar(userId, uploadFile);
        return { success: true, message: 'Avatar uploaded successfully.', data };
    }
}