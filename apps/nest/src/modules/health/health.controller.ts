import { Controller, Get, Head, HttpCode, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly db: NodePgDatabase,
  ) { }

  @Get()
  @ApiOperation({ summary: 'API Server Status', description: 'Mengecek status utama server' })
  @ApiResponse({ status: 200, description: 'Server online' })
  root() {
    return { status: 'ok', message: 'Aumo API Server Online 🚀' };
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
    description: 'Mengecek ketersediaan server dan koneksi database',
  })
  @ApiResponse({ status: 200, description: 'Server dan database berjalan normal' })
  @ApiResponse({ status: 503, description: 'Server atau database bermasalah' })
  async health() {
    try {
      // Cek koneksi ke PostgreSQL via Drizzle
      await this.db.execute('SELECT 1');

      return {
        status: 'online',
        database: 'connected',
        commit: process.env.RENDER_GIT_COMMIT || null,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      throw new ServiceUnavailableException({
        status: 'offline',
        database: 'error',
        message: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
}