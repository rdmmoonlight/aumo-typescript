import { z } from 'zod';

export const createExampleSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    description: z.string().optional(),
});

export const queryExampleSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
});

export type CreateExampleDto = z.infer<typeof createExampleSchema>;
export type QueryExampleDto = z.infer<typeof queryExampleSchema>;