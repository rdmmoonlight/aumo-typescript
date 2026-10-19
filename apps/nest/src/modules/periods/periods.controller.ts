import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CreatePeriodRequest, PeriodsService } from './periods.service.js';

@Controller('periods')
@UseGuards(AuthGuard)
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) { }

  @Get()
  async getPeriods(@Req() req: { user?: { id?: number }; authSession?: { user?: { id?: number } } }) {
    const userId = req.user?.id || req.authSession?.user?.id;
    return await this.periodsService.getPeriods(String(userId));
  }

  @Get('open-info')
  async getOpenPeriodInfo(@Req() req: { user?: { id?: number }; authSession?: { user?: { id?: number } } }) {
    const userId = req.user?.id || req.authSession?.user?.id;
    return await this.periodsService.getOpenPeriodInfo(String(userId));
  }

  @Post()
  async createPeriod(
    @Req() req: { user?: { id?: number }; authSession?: { user?: { id?: number } } },
    @Body() body: CreatePeriodRequest,
  ) {
    const userId = req.user?.id || req.authSession?.user?.id;
    return await this.periodsService.createPeriod(String(userId), body);
  }

  @Post(':id/select')
  async selectPeriod(
    @Req() req: { user?: { id?: number }; authSession?: { user?: { id?: number } } },
    @Param('id') id: string,
  ) {
    const userId = req.user?.id || req.authSession?.user?.id;
    const periodId = parseInt(id, 10);
    return await this.periodsService.selectPeriod(String(userId), periodId);
  }

  @Post('clear-selection')
  async clearSelection(@Req() req: { user?: { id?: number }; authSession?: { user?: { id?: number } } }) {
    const userId = req.user?.id || req.authSession?.user?.id;
    return await this.periodsService.clearSelection(String(userId));
  }

  @Post(':id/close')
  async closePeriod(
    @Req() req: { user?: { id?: number }; authSession?: { user?: { id?: number } } },
    @Param('id') id: string,
  ) {
    const userId = req.user?.id || req.authSession?.user?.id;
    const periodId = parseInt(id, 10);
    return await this.periodsService.closePeriod(String(userId), periodId);
  }
}
