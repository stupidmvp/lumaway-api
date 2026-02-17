
import { HookContext } from '@flex-donec/core';

export const castQuery = (options: { booleans?: string[]; numbers?: string[] }) => {
    return async (context: HookContext) => {
        const { params } = context;
        const { query } = params;

        if (query) {
            if (options.booleans) {
                options.booleans.forEach((field) => {
                    if (typeof query[field] === 'string') {
                        if (query[field] === 'true') query[field] = true;
                        else if (query[field] === 'false') query[field] = false;
                    }
                });
            }

            if (options.numbers) {
                options.numbers.forEach((field) => {
                    if (typeof query[field] === 'string') {
                        const num = Number(query[field]);
                        if (!isNaN(num)) query[field] = num;
                    }
                });
            }

            // Always cast $limit and $skip if they are present
            ['$limit', '$skip'].forEach((field) => {
                if (typeof query[field] === 'string') {
                    const num = Number(query[field]);
                    if (!isNaN(num)) query[field] = num;
                }
            });
        }

        return context;
    };
};
