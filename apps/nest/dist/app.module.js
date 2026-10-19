var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { GlobalRateLimitGuard } from './common/guards/rate-limit.guard.js';
import { databaseProvider } from './db/database.provider.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { PeriodsModule } from './modules/periods/periods.module.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
            }),
            HealthModule,
            AuthModule,
            PeriodsModule,
        ],
        providers: [
            databaseProvider,
            { provide: APP_FILTER, useClass: GlobalExceptionFilter },
            { provide: APP_GUARD, useClass: GlobalRateLimitGuard },
        ],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map