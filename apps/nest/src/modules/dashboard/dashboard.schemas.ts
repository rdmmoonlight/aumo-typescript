import { z } from 'zod';

export const queryDashboardSchema = z.object({
    period: z.enum(['monthly', 'annual']).optional().default('monthly'),
});

export type QueryDashboardDto = z.infer<typeof queryDashboardSchema>;