import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { GlobalRateLimitGuard } from './common/guards/rate-limit.guard.js';
import { databaseProvider } from './db/database.provider.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { PeriodsModule } from './modules/periods/periods.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Membuat ConfigService tersedia di seluruh modul tanpa perlu re-import
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
export class AppModule {}
