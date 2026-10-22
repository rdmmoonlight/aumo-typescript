import {
    Controller,
    Get,
    Headers,
    HttpCode,
    Param,
    ParseUUIDPipe,
    Put,
    Query,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { QueryNotificationDto, queryNotificationSchema } from './notifications.schemas.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationDto } from './notifications.types.js';

/** Setara NotificationsController sumber: GET daftar, PUT {id}/read, PUT read-all (204). */
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    getMyNotifications(
        @Headers('x-user-id') userId: string,
        @Query(new ZodValidationPipe(queryNotificationSchema)) query: QueryNotificationDto,
    ): Promise<NotificationDto[]> {
        return this.notificationsService.findMyNotifications(userId, query);
    }

    @Put('read-all')
    @HttpCode(204)
    async markAllAsRead(@Headers('x-user-id') userId: string): Promise<void> {
        await this.notificationsService.markAllAsRead(userId);
    }

    @Put(':id/read')
    @HttpCode(204)
    async markAsRead(
        @Headers('x-user-id') userId: string,
        @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    ): Promise<void> {
        await this.notificationsService.markAsRead(userId, id);
    }
}
