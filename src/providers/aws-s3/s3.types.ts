export interface S3SignUrlParams {
    bucket: string;
    s3Key: string;
    contentType: string;
}

export interface S3SignUrlResult {
    signedUrl: string;
    s3Path: string;
    s3PathWithoutBucket: string;
    headers: {
        'Content-Type': string;
    };
}
