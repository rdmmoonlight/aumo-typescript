import { z } from 'zod';

export const queryNotificationSchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(10),
});

export type QueryNotificationDto = z.infer<typeof queryNotificationSchema>;