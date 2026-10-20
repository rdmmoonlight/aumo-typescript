// libs/contracts/src/auth.schema.ts
import { z } from 'zod';

export const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    client: z.enum(['web', 'mobile']),
});

export const RegisterRequestSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string(),
    client: z.enum(['web', 'mobile']),
});

export const AuthUserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
});

export const JwtClaimsSchema = z.object({
    user_id: z.string(),
    email: z.string().email(),
}).passthrough();

export const AuthResponseSchema = z.object({
    message: z.string(),
    data: AuthUserSchema,
});

export const MeResponseSchema = z.object({
    message: z.string().optional(),
    data: JwtClaimsSchema,
});

// TypeScript Types Inference
export type LoginPayload = z.infer<typeof LoginRequestSchema>;
export type RegisterPayload = z.infer<typeof RegisterRequestSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type JwtClaims = z.infer<typeof JwtClaimsSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;