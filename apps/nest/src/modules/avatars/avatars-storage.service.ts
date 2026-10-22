import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { AvatarFile } from './avatars.types.js';

@Injectable()
export class AvatarsStorageService {
    private s3Client: S3Client | null = null;
    private bucketName: string;

    constructor() {
        this.bucketName = process.env.S3_NEON_BUCKET || '';
        const region = process.env.S3_REGION || 'us-east-1';
        const endpoint = process.env.S3_ENDPOINT;

        // Memeriksa ketersediaan konfigurasi S3
        if (this.bucketName) {
            this.s3Client = new S3Client({
                region,
                endpoint: endpoint || undefined,
                forcePathStyle: true,
            });
        }
    }

    get isConfigured(): boolean {
        return this.s3Client !== null && this.bucketName !== '';
    }

    async getAvatar(fileName: string): Promise<AvatarFile | null> {
        if (!this.isConfigured || !this.s3Client) {
            return null;
        }

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: `avatars/${fileName}`,
            });

            const response = await this.s3Client.send(command);

            if (!response.Body) {
                return null;
            }

            return {
                stream: response.Body as Readable,
                contentType: response.ContentType || 'image/jpeg',
            };
        } catch (error) {
            // Mengabaikan error 'NoSuchKey' atau error S3 dan mengembalikan null
            return null;
        }
    }
}