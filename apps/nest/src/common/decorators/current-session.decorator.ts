import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ActiveSession, AuthenticatedRequest } from '../../types/auth.js';

export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ActiveSession => {
    const req = context.switchToHttp().getRequest<
      AuthenticatedRequest & {
        authSession?: ActiveSession;
        currentSession?: ActiveSession;
        user?: unknown;
        session?: unknown;
      }
    >();
    // Coba authSession dulu (yang di-set AuthGuard), fallback ke currentSession, user, session
    return (req.authSession ||
      req.currentSession || { user: req.user, session: req.session }) as ActiveSession;
  }
);
