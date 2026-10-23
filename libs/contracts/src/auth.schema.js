"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeResponseSchema = exports.AuthResponseSchema = exports.JwtClaimsSchema = exports.AuthUserSchema = exports.RegisterRequestSchema = exports.LoginRequestSchema = void 0;
// libs/contracts/src/auth.schema.ts
const zod_1 = require("zod");
exports.LoginRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
    client: zod_1.z.enum(['web', 'mobile']),
});
exports.RegisterRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
    client: zod_1.z.enum(['web', 'mobile']),
});
exports.AuthUserSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string(),
});
exports.JwtClaimsSchema = zod_1.z.object({
    user_id: zod_1.z.string(),
    email: zod_1.z.string().email(),
}).passthrough();
exports.AuthResponseSchema = zod_1.z.object({
    message: zod_1.z.string(),
    data: exports.AuthUserSchema,
});
exports.MeResponseSchema = zod_1.z.object({
    message: zod_1.z.string().optional(),
    data: exports.JwtClaimsSchema,
});
