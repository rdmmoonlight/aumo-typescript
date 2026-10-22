import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryNotificationDto } from './notifications.schemas.js';
import { NotificationDto } from './notifications.types.js';

@Injectable()
export class NotificationsService {
    async findMyNotifications(
        userId: string,
        query: QueryNotificationDto,
    ): Promise<NotificationDto[]> {
        return [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                title: 'Notifikasi Sistem',
                message: 'Selamat datang di aplikasi',
                type: 'INFO',
                isRead: false,
                targetUrl: '/dashboard',
                createdAt: new Date(),
            },
        ];
    }

    async markAsRead(userId: string, id: string): Promise<void> {
        if (id === 'not-found') {
            throw new NotFoundException({
                success: false,
                message: 'Notifikasi tidak ditemukan',
            });
        }
    }

    async markAllAsRead(userId: string): Promise<void> { }
}