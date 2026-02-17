import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3SignUrlParams, S3SignUrlResult } from './s3.types';

export class S3Provider {
    private client: S3Client;

    constructor(client?: S3Client) {
        this.client = client || new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }

    async signUrl({ bucket, s3Key, contentType }: S3SignUrlParams): Promise<S3SignUrlResult> {
        const bucketName = bucket || process.env.AWS_BUCKET_NAME;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            ContentType: contentType || 'application/octet-stream',
        });

        const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });

        return {
            signedUrl: url,
            s3Path: `s3://${bucketName}/${s3Key}`,
            s3PathWithoutBucket: s3Key,
            headers: {
                'Content-Type': contentType,
            },
        };
    }

    async getSignedDownloadUrl(key: string, bucket?: string): Promise<string> {
        const bucketName = bucket || process.env.AWS_BUCKET_NAME;
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key.startsWith('/') ? key.substring(1) : key,
        });
        return getSignedUrl(this.client, command, { expiresIn: 3600 });
    }

    async fileExists(key: string, bucket?: string): Promise<boolean> {
        const bucketName = bucket || process.env.AWS_BUCKET_NAME;
        try {
            await this.client.send(new HeadObjectCommand({
                Bucket: bucketName,
                Key: key.startsWith('/') ? key.substring(1) : key,
            }));
            return true;
        } catch {
            return false;
        }
    }
}

export const s3Provider = new S3Provider();
