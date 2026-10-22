import { ApiResponse } from '../../common/types/api-response.type.js';

export interface AvatarUploadResult {
    avatarUrl: string;
    fileName: string;
}

export type AvatarResponse = ApiResponse<AvatarUploadResult>;
export type SettingsMessageResponse = ApiResponse<null>;

// Tipe ini untuk dokumentasi kontrak Go service
export interface UpdateProfileDto {
    userName?: string;
    fullName?: string;
    bio?: string;
    phoneNumber?: string;
    avatarUrl?: string;
}