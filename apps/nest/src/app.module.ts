import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { GlobalRateLimitGuard } from './common/guards/rate-limit.guard.js';
import { UserIdGuard } from './common/guards/user-id.guard.js';
import { databaseProvider } from './db/database.provider.js';
import { AvatarsModule } from './modules/avatars/avatars.module.js';
import { DrizzleModule } from './modules/drizzle/drizzle.module.js';
import { ExampleModule } from './modules/example/example.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ExampleModule,
    HealthModule,
    DrizzleModule,
    NotificationsModule,
    AvatarsModule,
  ],
  providers: [
    provide: APP_GUARD,
    useClass: AuthGuard,
    UserIdGuard,
  ],
})
export class AppModule { }
