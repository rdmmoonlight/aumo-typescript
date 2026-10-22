import { Controller, Get, Head, HttpCode, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { InjectDrizzle } from '../drizzle/drizzle.decorator.js';

@ApiTags('Health')
@Public()
@Controller()
export class HealthController {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
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
  async health(@Res({ passthrough: true }) res: Response) {
    try {
      // Cek koneksi ke PostgreSQL via Drizzle (setara CanConnectAsync sumber)
      await this.db.execute(sql`SELECT 1`);

      return {
        status: 'online',
        database: 'connected',
        commit: process.env.RENDER_GIT_COMMIT || null,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      // Bentuk 503 sama dengan HealthController sumber
      res.status(503);
      return {
        status: 'offline',
        database: 'error',
        message: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
