import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { AvatarFile } from './avatars.types.js';

const KEY_PREFIX = 'avatars/';
/** Sama dengan NeonBucketStorage.FileNamePattern sumber (mencegah path traversal). */
const FILE_NAME_PATTERN = /^[A-Za-z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i;

const CONTENT_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
};

@Injectable()
export class AvatarsStorageService {
    private readonly s3Client: S3Client | null = null;
    private readonly bucketName: string;

    constructor() {
        const endpoint = process.env.AWS_ENDPOINT_URL_S3;
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const region = process.env.AWS_REGION || 'ap-southeast-1';
        this.bucketName = process.env.S3_BUCKET || 'assets';

        if (endpoint?.trim() && accessKeyId?.trim() && secretAccessKey?.trim()) {
            this.s3Client = new S3Client({
                region,
                endpoint,
                forcePathStyle: true,
                credentials: { accessKeyId, secretAccessKey },
                requestChecksumCalculation: 'WHEN_REQUIRED',
                responseChecksumValidation: 'WHEN_REQUIRED',
            });
        }
    }

    get isConfigured(): boolean {
        return this.s3Client !== null;
    }

    async getAvatar(fileName: string): Promise<AvatarFile | null> {
        if (!this.s3Client || !FILE_NAME_PATTERN.test(fileName)) {
            return null;
        }

        try {
            const response = await this.s3Client.send(
                new GetObjectCommand({ Bucket: this.bucketName, Key: KEY_PREFIX + fileName }),
            );
            if (!response.Body) {
                return null;
            }

            const ext = fileName.split('.').pop()!.toLowerCase();
            return {
                stream: response.Body as Readable,
                contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream',
            };
        } catch {
            // NoSuchKey atau galat S3 lain: perlakukan sebagai tidak ditemukan
            return null;
        }
    }
}
