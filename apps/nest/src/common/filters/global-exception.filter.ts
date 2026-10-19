import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppError, ValidationError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

interface ErrorBody {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

function httpExceptionMessage(exception: HttpException): string {
  const res = exception.getResponse();
  const raw = typeof res === 'string' ? res : (res as { message?: string | string[] }).message;
  const message = Array.isArray(raw) ? raw.join(', ') : (raw ?? exception.message);

  // Pesan bawaan Nest untuk route yang tidak ada: "Cannot GET /x"
  if (exception.getStatus() === HttpStatus.NOT_FOUND && message.startsWith('Cannot ')) {
    return 'Route tidak ditemukan';
  }
  return message;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  // Ubah ke any untuk mempermudah pengecekan error dari express middleware (body-parser)
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const errorDetails = exception as { type?: unknown; status?: unknown } | null;

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = { success: false, message: 'Terjadi kesalahan pada server' };

    if (exception instanceof ValidationError) {
      status = exception.statusCode;
      body = { success: false, message: exception.message, errors: exception.errors };
    } else if (exception instanceof AppError) {
      status = exception.statusCode;
      body = { success: false, message: exception.message };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      body = { success: false, message: httpExceptionMessage(exception) };
    } else if (
      exception instanceof SyntaxError &&
      (exception as SyntaxError & { status?: number }).status === 400
    ) {
      // Menangkap error dari body-parser ketika format JSON rusak
      status = HttpStatus.BAD_REQUEST;
      body = { success: false, message: 'Format JSON tidak valid' };
    } else if (errorDetails?.type === 'entity.too.large' || errorDetails?.status === 413) {
      // Menangkap error dari body-parser ketika ukuran payload melebihi limit
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      body = { success: false, message: 'Ukuran request terlalu besar' };
    }

    // Hanya kegagalan server yang dicatat sebagai error; 4xx adalah kesalahan client
    if (status >= 500) {
      logger.error(
        { err: exception, url: request.url, requestId: response.locals?.requestId },
        'Unhandled route error'
      );
      body = { success: false, message: 'Terjadi kesalahan pada server' };
    }

    // Pastikan mengirim status code yang benar
    response.status(status).json(body);
  }
}
