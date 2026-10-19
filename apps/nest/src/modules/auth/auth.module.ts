import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AuthRateLimitGuard } from '../../common/guards/rate-limit.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AuthRateLimitGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
