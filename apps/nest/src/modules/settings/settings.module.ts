import { Module } from '@nestjs/common';
import { AvatarsModule } from '../avatars/avatars.module.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

@Module({
    imports: [AvatarsModule],
    controllers: [SettingsController],
    providers: [SettingsService],
})
export class SettingsModule { }