"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserSchema = exports.UserSchema = void 0;
// libs/contracts/src/user.schema.ts
const zod_1 = require("zod");
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    createdAt: zod_1.z.string().datetime(),
});
exports.CreateUserSchema = exports.UserSchema.omit({ id: true, createdAt: true });
