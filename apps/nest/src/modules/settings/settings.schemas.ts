import { z } from 'zod';

export const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;
export const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'] as const;
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export const avatarFileSchema = z.object({
    mimetype: z.enum(ALLOWED_MIME),
    size: z.number().max(MAX_AVATAR_SIZE, 'Ukuran file maksimal 5MB'),
    originalname: z.string().refine((name) => {
        const ext = name.toLowerCase().slice(name.lastIndexOf('.'));
        return (ALLOWED_EXT as readonly string[]).includes(ext);
    }, 'Format file harus jpg, jpeg, png, webp'),
});