import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PeriodsService, CreatePeriodRequest } from './periods.service.js';

@Controller('periods')
@UseGuards(AuthGuard)
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Get()
  async getPeriods(@Req() req: any) {
    const userId = req.user?.id || req.authSession?.user?.id;
    return await this.periodsService.getPeriods(userId);
  }

  @Get('open-info')
  async getOpenPeriodInfo(@Req() req: any) {
    const userId = req.user?.id || req.authSession?.user?.id;
    return await this.periodsService.getOpenPeriodInfo(userId);
  }

  @Post()
  async createPeriod(@Req() req: any, @Body() body: CreatePeriodRequest) {
    const userId = req.user?.id || req.authSession?.user?.id;
    return await this.periodsService.createPeriod(userId, body);
  }

  @Post(':id/select')
  async selectPeriod(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || req.authSession?.user?.id;
    const periodId = parseInt(id, 10);
    return await this.periodsService.selectPeriod(userId, periodId);
  }

  @Post('clear-selection')
  async clearSelection(@Req() req: any) {
    const userId = req.user?.id || req.authSession?.user?.id;
    return await this.periodsService.clearSelection(userId);
  }

  @Post(':id/close')
  async closePeriod(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || req.authSession?.user?.id;
    const periodId = parseInt(id, 10);
    return await this.periodsService.closePeriod(userId, periodId);
  }
}
