var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service.js';
let AuthGuard = class AuthGuard {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        try {
            let authService = this.authService;
            if (!authService) {
                authService = globalThis.__AUTH_SERVICE_MOCK__;
            }
            if (!authService || typeof authService.getSession !== 'function') {
                throw new UnauthorizedException({ success: false, message: 'Unauthorized' });
            }
            const session = await authService.getSession(req.headers);
            if (!session || !session.user) {
                throw new UnauthorizedException({ success: false, message: 'Unauthorized' });
            }
            req.authSession = session;
            req.user = session.user;
            req.session = session.session;
            req.currentSession = session;
            return true;
        }
        catch (err) {
            if (err instanceof UnauthorizedException)
                throw err;
            throw new UnauthorizedException({ success: false, message: 'Unauthorized' });
        }
    }
};
AuthGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AuthService])
], AuthGuard);
export { AuthGuard };
//# sourceMappingURL=auth.guard.js.map