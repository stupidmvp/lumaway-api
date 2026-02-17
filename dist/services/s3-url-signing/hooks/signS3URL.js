"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signS3URL = void 0;
const providers_1 = require("../../../providers");
const signS3URL = async (context) => {
    const { bucket, s3Key, contentType } = context.data;
    const s3 = new providers_1.S3Provider();
    const result = await s3.signUrl({ bucket, s3Key, contentType });
    context.result = {
        signedUrl: result.signedUrl,
        s3Path: result.s3Path,
        s3PathWithoutBucket: result.s3PathWithoutBucket,
        headers: result.headers,
    };
    return context;
};
exports.signS3URL = signS3URL;
