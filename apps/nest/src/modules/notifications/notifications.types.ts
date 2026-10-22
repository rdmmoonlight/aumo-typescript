/** Bentuk respons sama dengan NotificationDto sumber (.NET). */
export interface NotificationDto {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    targetUrl: string | null;
    createdAt: string;
}
