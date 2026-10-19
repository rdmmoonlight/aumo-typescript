import { Controller, Get, Head, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'API Server Status', description: 'Mengecek status utama server' })
  @ApiResponse({ status: 200, description: 'Server online' })
  root() {
    return { status: 'ok', message: 'Aumone API Server Online 🚀' };
  }

  @Head()
  @HttpCode(200)
  @ApiOperation({ summary: 'Ping API Server' })
  @ApiResponse({ status: 200, description: 'Server merespon ping' })
  ping(): void {
    return;
  }

  @Get('health')
  @ApiOperation({
    summary: 'Basic Health Check',
    description: 'Mengecek ketersediaan server secara umum',
  })
  @ApiResponse({ status: 200, description: 'Server berjalan dengan baik' })
  health() {
    return { status: 'pass', timestamp: new Date().toISOString() };
  }
}
