import { HookContext } from '@flex-donec/core';
import { ilike } from 'drizzle-orm';

export const search = (options: { fields: string[] }) => {
    return async (context: HookContext) => {
        const { params } = context;
        const { query } = params;

        if (query && typeof query.search !== 'undefined') {
            const searchTerm = query.search;
            delete query.search;

            if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
                // Apply ilike filter to the first specified field for now
                const searchField = options.fields[0];
                if (searchField) {
                    query[searchField] = { $ilike: `%${searchTerm}%` };
                }
            }
        }

        return context;
    };
};
