import {
    Controller,
    Get,
    Headers,
    Param,
    Patch,
    Query
} from '@nestjs/common';
import {
    QueryNotificationDto,
    queryNotificationSchema,
} from './notifications.schemas.js';
import { NotificationsService } from './notifications.service.js';
import {
    NotificationActionResponse,
    NotificationListResponse,
} from './notifications.types.js';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async getMyNotifications(
        @Headers('x-user-id') userId: string,
        @Query() query: QueryNotificationDto,
    ): Promise<NotificationListResponse> {
        const parsedQuery = queryNotificationSchema.parse(query);
        const data = await this.notificationsService.findMyNotifications(
            userId,
            parsedQuery,
        );

        return {
            success: true,
            message: 'Daftar notifikasi berhasil diambil',
            data,
        };
    }

    @Patch(':id/read')
    async markAsRead(
        @Headers('x-user-id') userId: string,
        @Param('id') id: string,
    ): Promise<NotificationActionResponse> {
        await this.notificationsService.markAsRead(userId, id);

        return {
            success: true,
            message: 'Notifikasi berhasil ditandai sebagai dibaca',
        };
    }

    @Patch('read-all')
    async markAllAsRead(
        @Headers('x-user-id') userId: string,
    ): Promise<NotificationActionResponse> {
        await this.notificationsService.markAllAsRead(userId);

        return {
            success: true,
            message: 'Semua notifikasi berhasil ditandai sebagai dibaca',
        };
    }
}