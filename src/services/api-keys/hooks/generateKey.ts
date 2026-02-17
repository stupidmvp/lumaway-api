import { HookContext } from '@flex-donec/core';
import * as crypto from 'crypto';

export const generateKey = (context: HookContext) => {
    const { data } = context;
    if (!data.key) {
        // Simple random key for MVP. 
        // Could be 'sk_live_' + random string.
        data.key = 'sk_' + crypto.randomBytes(24).toString('hex');
    }
    return context;
};
