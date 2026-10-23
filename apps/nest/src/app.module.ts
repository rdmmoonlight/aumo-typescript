import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { GlobalRateLimitGuard } from './common/guards/rate-limit.guard.js';
import { UserIdGuard } from './common/guards/user-id.guard.js';
import { AvatarsModule } from './modules/avatars/avatars.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { DrizzleModule } from './modules/drizzle/drizzle.module.js';
import { ExampleModule } from './modules/example/example.module.js';
import { HomeModule } from './modules/home/home.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { JournalEntryModule } from './modules/journal-entries/journal-entry.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { ToolsModule } from './modules/tools/tools.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ExampleModule,
    HealthModule,
    DrizzleModule.register(),
    HomeModule,
    NotificationsModule,
    AvatarsModule,
    DashboardModule,
    JournalEntryModule,
    ToolsModule,
    SettingsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: GlobalRateLimitGuard },
    { provide: APP_GUARD, useClass: UserIdGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule { }
