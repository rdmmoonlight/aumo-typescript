var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, Get, Head, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
let HealthController = class HealthController {
    root() {
        return { status: 'ok', message: 'Aumone API Server Online 🚀' };
    }
    ping() {
        return;
    }
    health() {
        return { status: 'pass', timestamp: new Date().toISOString() };
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'API Server Status', description: 'Mengecek status utama server' }),
    ApiResponse({ status: 200, description: 'Server online' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "root", null);
__decorate([
    Head(),
    HttpCode(200),
    ApiOperation({ summary: 'Ping API Server' }),
    ApiResponse({ status: 200, description: 'Server merespon ping' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "ping", null);
__decorate([
    Get('health'),
    ApiOperation({
        summary: 'Basic Health Check',
        description: 'Mengecek ketersediaan server secara umum',
    }),
    ApiResponse({ status: 200, description: 'Server berjalan dengan baik' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "health", null);
HealthController = __decorate([
    ApiTags('Health'),
    Controller()
], HealthController);
export { HealthController };
//# sourceMappingURL=health.controller.js.map