import { Readable } from 'stream';

export interface AvatarFile {
    stream: Readable;
    contentType: string;
}

export interface StorageConfig {
    isConfigured: boolean;
}