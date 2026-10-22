import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HomeController } from './home.controller.js';
import { HomeService } from './home.service.js';

@Module({
    imports: [
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 3,
        }),
        ConfigModule,
    ],
    controllers: [HomeController],
    providers: [HomeService],
    exports: [HomeService],
})
export class HomeModule { }