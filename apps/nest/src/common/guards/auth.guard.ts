import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        // Ambil header x-user-id (Express/Fastify otomatis menormalisasi header ke lowercase)
        const rawUserId = request.headers?.['x-user-id'];

        // Jika header berupa array (misal dikirim berulang), ambil elemen pertama
        const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

        // Validasi keberadaan dan tipe string non-kosong
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new UnauthorizedException({
                success: false,
                message: 'Header X-User-Id wajib diisi',
            });
        }

        // Simpan data user yang sudah di-trim ke objek request
        request.user = { id: userId.trim() };

        return true;
    }
}