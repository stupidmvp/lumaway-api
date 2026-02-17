"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformS3Data = void 0;
const path_1 = __importDefault(require("path"));
const getContentTypeFromFilename = (filename) => {
    const ext = path_1.default.extname(filename).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.zip': 'application/zip',
        '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
};
const transformS3Data = async (context) => {
    const { filename, bucket } = context.data;
    const filePath = context.data.path || 'uploads';
    const s3Key = `${filePath}/${filename}`;
    const contentType = getContentTypeFromFilename(filename);
    context.data = {
        ...context.data,
        s3Key,
        contentType,
        bucket,
    };
    return context;
};
exports.transformS3Data = transformS3Data;
