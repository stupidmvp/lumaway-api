"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Provider = exports.S3Provider = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Provider {
    constructor(client) {
        this.client = client || new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }
    async signUrl({ bucket, s3Key, contentType }) {
        const bucketName = bucket || process.env.AWS_BUCKET_NAME;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            ContentType: contentType || 'application/octet-stream',
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: 3600 });
        return {
            signedUrl: url,
            s3Path: `s3://${bucketName}/${s3Key}`,
            s3PathWithoutBucket: s3Key,
            headers: {
                'Content-Type': contentType,
            },
        };
    }
    async getSignedDownloadUrl(key, bucket) {
        const bucketName = bucket || process.env.AWS_BUCKET_NAME;
        const command = new client_s3_1.GetObjectCommand({
            Bucket: bucketName,
            Key: key.startsWith('/') ? key.substring(1) : key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: 3600 });
    }
    async fileExists(key, bucket) {
        const bucketName = bucket || process.env.AWS_BUCKET_NAME;
        try {
            await this.client.send(new client_s3_1.HeadObjectCommand({
                Bucket: bucketName,
                Key: key.startsWith('/') ? key.substring(1) : key,
            }));
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.S3Provider = S3Provider;
exports.s3Provider = new S3Provider();
