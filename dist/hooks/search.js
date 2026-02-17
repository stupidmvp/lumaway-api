"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = void 0;
const search = (options) => {
    return async (context) => {
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
exports.search = search;
