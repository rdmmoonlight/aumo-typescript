import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { notifications } from '../../db/schema/notifications.js';
import { InjectDrizzle } from '../drizzle/drizzle.decorator.js';
import { QueryNotificationDto } from './notifications.schemas.js';
import { NotificationDto } from './notifications.types.js';

@Injectable()
export class NotificationsService {
    constructor(@InjectDrizzle() private readonly db: NodePgDatabase) { }

    async findMyNotifications(
        userId: string,
        query: QueryNotificationDto,
    ): Promise<NotificationDto[]> {
        const rows = await this.db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(query.limit);

        return rows.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: n.isRead,
            targetUrl: n.targetUrl ?? null,
            createdAt: n.createdAt.toISOString(),
        }));
    }

    async markAsRead(userId: string, id: string): Promise<void> {
        const updated = await this.db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
            .returning({ id: notifications.id });

        if (updated.length === 0) {
            throw new NotFoundException('Notifikasi tidak ditemukan');
        }
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    }
}
