import { z } from 'zod';

export const getKursQuerySchema = z.object({
    baseCurrency: z.string().optional().default('USD'),
    targetCurrency: z.string().optional().default('IDR'),
});

export type GetKursQueryDto = z.infer<typeof getKursQuerySchema>;