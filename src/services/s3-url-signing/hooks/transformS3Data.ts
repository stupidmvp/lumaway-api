import path from 'path';

const getContentTypeFromFilename = (filename: string): string => {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
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

export const transformS3Data = async (context: any) => {
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
