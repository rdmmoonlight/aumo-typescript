"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionPeriodResponseSchema = exports.CreatePeriodRequestSchema = exports.OpenPeriodInfoSchema = exports.GetPeriodsResponseSchema = exports.PeriodSchema = void 0;
const zod_1 = require("zod");
exports.PeriodSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    isClosed: zod_1.z.boolean(),
    isSelected: zod_1.z.boolean().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.GetPeriodsResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    selectedPeriodId: zod_1.z.string().nullable().optional(),
    periods: zod_1.z.array(exports.PeriodSchema),
});
exports.OpenPeriodInfoSchema = zod_1.z.object({
    year: zod_1.z.number(),
    month: zod_1.z.number(),
    suggestedName: zod_1.z.string().optional(),
    canCreateNew: zod_1.z.boolean().optional(),
    canLoadExisting: zod_1.z.boolean().optional(),
});
exports.CreatePeriodRequestSchema = zod_1.z.object({
    year: zod_1.z.number(),
    month: zod_1.z.number(),
    setupMode: zod_1.z.enum(['CreateNew', 'LoadExisting']),
}).passthrough();
exports.ActionPeriodResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    periodId: zod_1.z.string().optional(),
});
