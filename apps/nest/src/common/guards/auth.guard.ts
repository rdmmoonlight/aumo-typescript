import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService?: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      // Coba dari injection, kalau undefined (karena @UseGuards new instance tanpa DI), ambil dari global mock
      let authService: Partial<Pick<AuthService, 'getSession'>> | undefined = this.authService;
      if (!authService) {
        authService = (globalThis as typeof globalThis & {
          __AUTH_SERVICE_MOCK__?: Partial<Pick<AuthService, 'getSession'>>;
        }).__AUTH_SERVICE_MOCK__;
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
      req.currentSession = session;
      return true;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({ success: false, message: 'Unauthorized' });
    }
  }
}
