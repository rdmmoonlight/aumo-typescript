import { z } from 'zod';

export const PeriodSchema = z.object({
    id: z.string(),
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    isClosed: z.boolean(),
    isSelected: z.boolean().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const GetPeriodsResponseSchema = z.object({
    success: z.boolean(),
    selectedPeriodId: z.string().nullable().optional(),
    periods: z.array(PeriodSchema),
});

export const OpenPeriodInfoSchema = z.object({
    year: z.number(),
    month: z.number(),
    suggestedName: z.string().optional(),
    canCreateNew: z.boolean().optional(),
    canLoadExisting: z.boolean().optional(),
});

export const CreatePeriodRequestSchema = z.object({
    year: z.number(),
    month: z.number(),
    setupMode: z.enum(['CreateNew', 'LoadExisting']),
}).passthrough();

export const ActionPeriodResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    periodId: z.string().optional(),
});