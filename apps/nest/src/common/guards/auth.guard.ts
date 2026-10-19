import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService?: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: any = context.switchToHttp().getRequest();
    try {
      // Coba dari injection, kalau undefined (karena @UseGuards new instance tanpa DI), ambil dari global mock
      let authService: any = this.authService;
      if (!authService) {
        authService = (globalThis as any).__AUTH_SERVICE_MOCK__;
      }

      if (!authService || typeof authService.getSession !== 'function') {
        // Jika masih gak ada, coba dari request (untuk prod)
        // Di prod, authService seharusnya ada, kalau gak ada -> 401
        throw new UnauthorizedException({ success: false, message: 'Unauthorized' });
      }

      const session = await authService.getSession(req.headers);

      if (!session || !session.user) {
        throw new UnauthorizedException({ success: false, message: 'Unauthorized' });
      }

      req.authSession = session;
      req.user = session.user;
      req.session = session.session;
      (req as any).currentSession = session;
      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({ success: false, message: 'Unauthorized' });
    }
  }
}
