import { Module } from '@nestjs/common';
import { AvatarsStorageService } from './avatars-storage.service.js';
import { AvatarsController } from './avatars.controller.js';
import { AvatarsService } from './avatars.service.js';

@Module({
    controllers: [AvatarsController],
    providers: [AvatarsService, AvatarsStorageService],
    exports: [AvatarsService, AvatarsStorageService],
})
export class AvatarsModule { }