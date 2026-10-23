import { Controller, Get, Headers, Query } from '@nestjs/common';
import { parseDashboardPeriod } from './dashboard.schemas.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardResponse } from './dashboard.types.js';

/** Setara DashboardController sumber: GET /dashboard?period=monthly|annual. */
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    getDashboard(
        @Headers('x-user-id') userId: string,
        @Query('period') period?: string,
    ): Promise<DashboardResponse> {
        return this.dashboardService.getDashboard(userId, parseDashboardPeriod(period));
    }
}
