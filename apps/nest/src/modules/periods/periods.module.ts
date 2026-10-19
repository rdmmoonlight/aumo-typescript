import { Module } from '@nestjs/common';
import { ChartOfAccountsService } from '../chart-of-accounts/chart-of-accounts.service.js';
import { OpeningBalanceService } from './opening-balance.service.js';
import { PeriodsController } from './periods.controller.js';
import { PeriodsService } from './periods.service.js';

@Module({
  controllers: [PeriodsController],
  providers: [PeriodsService, ChartOfAccountsService, OpeningBalanceService],
  exports: [PeriodsService],
})
export class PeriodsModule { }
