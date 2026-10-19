import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PeriodsService } from './periods.service.js';
import type { CreatePeriodRequest } from './periods.types.js';

@Controller('periods')
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) { }

  @Get()
  async getPeriods(@CurrentUser('id') userId: string) {
    return await this.periodsService.getPeriods(userId);
  }

  @Get('open-info')
  async getOpenPeriodInfo(@CurrentUser('id') userId: string) {
    return await this.periodsService.getOpenPeriodInfo(userId);
  }

  @Post()
  async createPeriod(
    @CurrentUser('id') userId: string,
    @Body() body: CreatePeriodRequest,
  ) {
    return await this.periodsService.createPeriod(userId, body);
  }

  @Post(':id/select')
  async selectPeriod(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const periodId = parseInt(id, 10);
    return await this.periodsService.selectPeriod(userId, periodId);
  }

  @Post('clear-selection')
  async clearSelection(@CurrentUser('id') userId: string) {
    return await this.periodsService.clearSelection(userId);
  }

  @Post(':id/close')
  async closePeriod(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const periodId = parseInt(id, 10);
    return await this.periodsService.closePeriod(userId, periodId);
  }
}