import { S3UrlSigningService } from './s3-url-signing.class';
import { authenticate } from '../../hooks/authenticate';
import { transformS3Data } from './hooks/transformS3Data';
import { signS3URL } from './hooks/signS3URL';

export const s3UrlSigningService = new S3UrlSigningService();

s3UrlSigningService.hooks({
    before: {
        all: [authenticate],
        create: [transformS3Data],
    },
    after: {
        create: [signS3URL],
    },
});
