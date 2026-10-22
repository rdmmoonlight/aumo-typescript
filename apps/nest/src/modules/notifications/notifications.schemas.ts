import { z } from 'zod';

/** Setara GetNotificationsQueryValidator sumber: limit 1-100. */
export const queryNotificationSchema = z.object({
    limit: z.coerce
        .number({ error: 'Limit must be between 1 and 100.' })
        .int('Limit must be between 1 and 100.')
        .min(1, 'Limit must be between 1 and 100.')
        .max(100, 'Limit must be between 1 and 100.')
        .default(10),
});

export type QueryNotificationDto = z.infer<typeof queryNotificationSchema>;
