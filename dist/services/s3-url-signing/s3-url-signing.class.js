"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3UrlSigningService = void 0;
const core_1 = require("@flex-donec/core");
const s3_url_signing_schema_1 = require("./s3-url-signing.schema");
class S3UrlSigningService extends core_1.BaseService {
    constructor() {
        super();
        this.schema = s3_url_signing_schema_1.s3UrlSigningSchema;
    }
    find(_params) {
        throw new Error('Method not implemented.');
    }
    get(_id, _params) {
        throw new Error('Method not implemented.');
    }
    create(data, _params) {
        return Promise.resolve(data);
    }
    patch(_id, _data, _params) {
        throw new Error('Method not implemented.');
    }
    remove(_id, _params) {
        throw new Error('Method not implemented.');
    }
}
exports.S3UrlSigningService = S3UrlSigningService;
