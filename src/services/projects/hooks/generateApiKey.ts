import { HookContext } from '@flex-donec/core';
import { apiKeysService } from '../../api-keys/api-keys.service';
import * as crypto from 'crypto';

export const generateApiKey = async (context: HookContext) => {
    const { result } = context;
    if (result && result.id) {
        try {
            const data: any = {
                projectId: result.id,
                key: 'sk_' + crypto.randomBytes(24).toString('hex')
            };
            await apiKeysService.create(data, { ...context.params });
        } catch (error) {
            console.error('Error generating API Key:', error);
            throw error;
        }
    }
    return context;
};
