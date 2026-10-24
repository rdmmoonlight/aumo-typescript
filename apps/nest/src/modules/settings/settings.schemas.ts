/** Setara AvatarFileValidator sumber. */
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
export const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;
export const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] as const;

export const AVATAR_SIZE_MESSAGE = 'File size exceeds limit (Max 2MB).';
export const AVATAR_TYPE_MESSAGE = 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.';
export const AVATAR_MISSING_MESSAGE =
    "No file uploaded. Ensure the form-data key is named 'file' or 'avatar'.";

/**
 * Pemeriksaan tanda tangan berkas (magic bytes). Tambahan di atas sumber: ekstensi dan Content-Type
 * dikirim klien dan mudah dipalsukan, sedangkan avatar disajikan publik.
 */
export function matchesImageSignature(buffer: Buffer, extension: string): boolean {
    const ext = extension.toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
        return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (ext === '.png') {
        return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    if (ext === '.gif') {
        const head = buffer.subarray(0, 6).toString('latin1');
        return head === 'GIF87a' || head === 'GIF89a';
    }
    if (ext === '.webp') {
        return (
            buffer.length >= 12 &&
            buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
            buffer.subarray(8, 12).toString('latin1') === 'WEBP'
        );
    }
    return false;
}

/** userId berasal dari header tepercaya (nginx), tetapi dipakai di nama berkas sehingga dibatasi ketat. */
export const SAFE_USER_ID = /^[A-Za-z0-9-]{1,64}$/;
