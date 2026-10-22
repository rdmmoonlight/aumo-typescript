import { ApiResponse } from '../../common/types/api-response.type.js';

export interface NotificationDto {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    targetUrl?: string;
    createdAt: Date;
}

export type NotificationListResponse = ApiResponse<NotificationDto[]>;
export type NotificationActionResponse = ApiResponse<null>;