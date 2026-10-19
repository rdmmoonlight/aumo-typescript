import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PeriodsController } from './periods.controller.js';
import { PeriodsService } from './periods.service.js';

@Module({
  // AuthGuard (dipakai @UseGuards di controller) membutuhkan AuthService dari AuthModule
  imports: [AuthModule],
  controllers: [PeriodsController],
  providers: [PeriodsService],
  exports: [PeriodsService],
})
export class PeriodsModule {}
