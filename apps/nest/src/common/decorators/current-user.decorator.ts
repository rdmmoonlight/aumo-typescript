import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
    id: string;
    [key: string]: unknown;
}

export const CurrentUser = createParamDecorator(
    (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<{
            user?: { id?: number | string };
            authSession?: { user?: { id?: number | string } };
            headers: Record<string, string | string[] | undefined>;
        }>();

        // Prioritas ekstraksi ID:
        // 1. Header yang dikirim dari Go Auth Service (misal: x-user-id)
        // 2. Property req.user atau req.authSession dari middleware NestJS
        const rawId =
            request.headers['x-user-id'] ??
            request.user?.id ??
            request.authSession?.user?.id;

        const user: CurrentUserPayload = {
            id: String(rawId ?? ''),
        };

        return data ? user[data] : user;
    },
);