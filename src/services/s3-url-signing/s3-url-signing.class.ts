import { BaseService, CreateData, Paginated, ServiceParams } from '@flex-donec/core';
import { s3UrlSigningSchema } from './s3-url-signing.schema';

export class S3UrlSigningService extends BaseService<typeof s3UrlSigningSchema> {
    constructor() {
        super();
        this.schema = s3UrlSigningSchema;
    }

    find(_params?: any): Promise<Paginated<any>> {
        throw new Error('Method not implemented.');
    }

    get(_id: string, _params?: ServiceParams): Promise<any> {
        throw new Error('Method not implemented.');
    }

    create(data: CreateData<typeof s3UrlSigningSchema>, _params?: ServiceParams): Promise<any> {
        return Promise.resolve(data);
    }

    patch(_id: string, _data: any, _params?: ServiceParams): Promise<any> {
        throw new Error('Method not implemented.');
    }

    remove(_id: string, _params?: ServiceParams): Promise<any> {
        throw new Error('Method not implemented.');
    }
}
