import { S3Provider } from '../../../providers';

export const signS3URL = async (context: any) => {
    const { bucket, s3Key, contentType } = context.data;
    const s3 = new S3Provider();
    const result = await s3.signUrl({ bucket, s3Key, contentType });

    context.result = {
        signedUrl: result.signedUrl,
        s3Path: result.s3Path,
        s3PathWithoutBucket: result.s3PathWithoutBucket,
        headers: result.headers,
    };

    return context;
};
