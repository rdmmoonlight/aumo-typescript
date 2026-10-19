var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import { AppError, ValidationError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
function httpExceptionMessage(exception) {
    const res = exception.getResponse();
    const raw = typeof res === 'string' ? res : res.message;
    const message = Array.isArray(raw) ? raw.join(', ') : (raw ?? exception.message);
    if (exception.getStatus() === HttpStatus.NOT_FOUND && message.startsWith('Cannot ')) {
        return 'Route tidak ditemukan';
    }
    return message;
}
let GlobalExceptionFilter = class GlobalExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const errorDetails = exception;
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let body = { success: false, message: 'Terjadi kesalahan pada server' };
        if (exception instanceof ValidationError) {
            status = exception.statusCode;
            body = { success: false, message: exception.message, errors: exception.errors };
        }
        else if (exception instanceof AppError) {
            status = exception.statusCode;
            body = { success: false, message: exception.message };
        }
        else if (exception instanceof HttpException) {
            status = exception.getStatus();
            body = { success: false, message: httpExceptionMessage(exception) };
        }
        else if (exception instanceof SyntaxError &&
            exception.status === 400) {
            status = HttpStatus.BAD_REQUEST;
            body = { success: false, message: 'Format JSON tidak valid' };
        }
        else if (errorDetails?.type === 'entity.too.large' || errorDetails?.status === 413) {
            status = HttpStatus.PAYLOAD_TOO_LARGE;
            body = { success: false, message: 'Ukuran request terlalu besar' };
        }
        if (status >= 500) {
            logger.error({ err: exception, url: request.url, requestId: response.locals?.requestId }, 'Unhandled route error');
            body = { success: false, message: 'Terjadi kesalahan pada server' };
        }
        response.status(status).json(body);
    }
};
GlobalExceptionFilter = __decorate([
    Catch()
], GlobalExceptionFilter);
export { GlobalExceptionFilter };
//# sourceMappingURL=global-exception.filter.js.map