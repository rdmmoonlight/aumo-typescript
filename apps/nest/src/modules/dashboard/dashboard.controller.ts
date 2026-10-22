import { Controller, Get, Headers, Query } from '@nestjs/common';
import { queryDashboardSchema } from './dashboard.schemas.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardResponse } from './dashboard.types.js';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    async getDashboardData(
        @Headers('x-user-id') userId: string,
        @Query() query: unknown,
    ): Promise<DashboardResponse> {
        const parsed = queryDashboardSchema.parse(query);
        const data = await this.dashboardService.getDashboardData(userId, parsed);

        return {
            success: true,
            message: 'Dashboard berhasil diambil',
            data,
        };
    }
}