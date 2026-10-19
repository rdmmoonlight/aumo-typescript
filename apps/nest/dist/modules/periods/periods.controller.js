var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PeriodsService } from './periods.service.js';
let PeriodsController = class PeriodsController {
    periodsService;
    constructor(periodsService) {
        this.periodsService = periodsService;
    }
    async getPeriods(req) {
        const userId = req.user?.id || req.authSession?.user?.id;
        return await this.periodsService.getPeriods(String(userId));
    }
    async getOpenPeriodInfo(req) {
        const userId = req.user?.id || req.authSession?.user?.id;
        return await this.periodsService.getOpenPeriodInfo(String(userId));
    }
    async createPeriod(req, body) {
        const userId = req.user?.id || req.authSession?.user?.id;
        return await this.periodsService.createPeriod(String(userId), body);
    }
    async selectPeriod(req, id) {
        const userId = req.user?.id || req.authSession?.user?.id;
        const periodId = parseInt(id, 10);
        return await this.periodsService.selectPeriod(String(userId), periodId);
    }
    async clearSelection(req) {
        const userId = req.user?.id || req.authSession?.user?.id;
        return await this.periodsService.clearSelection(String(userId));
    }
    async closePeriod(req, id) {
        const userId = req.user?.id || req.authSession?.user?.id;
        const periodId = parseInt(id, 10);
        return await this.periodsService.closePeriod(String(userId), periodId);
    }
};
__decorate([
    Get(),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PeriodsController.prototype, "getPeriods", null);
__decorate([
    Get('open-info'),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PeriodsController.prototype, "getOpenPeriodInfo", null);
__decorate([
    Post(),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PeriodsController.prototype, "createPeriod", null);
__decorate([
    Post(':id/select'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PeriodsController.prototype, "selectPeriod", null);
__decorate([
    Post('clear-selection'),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PeriodsController.prototype, "clearSelection", null);
__decorate([
    Post(':id/close'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PeriodsController.prototype, "closePeriod", null);
PeriodsController = __decorate([
    Controller('periods'),
    UseGuards(AuthGuard),
    __metadata("design:paramtypes", [PeriodsService])
], PeriodsController);
export { PeriodsController };
//# sourceMappingURL=periods.controller.js.map