"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3UrlSigningService = void 0;
const s3_url_signing_class_1 = require("./s3-url-signing.class");
const authenticate_1 = require("../../hooks/authenticate");
const transformS3Data_1 = require("./hooks/transformS3Data");
const signS3URL_1 = require("./hooks/signS3URL");
exports.s3UrlSigningService = new s3_url_signing_class_1.S3UrlSigningService();
exports.s3UrlSigningService.hooks({
    before: {
        all: [authenticate_1.authenticate],
        create: [transformS3Data_1.transformS3Data],
    },
    after: {
        create: [signS3URL_1.signS3URL],
    },
});
