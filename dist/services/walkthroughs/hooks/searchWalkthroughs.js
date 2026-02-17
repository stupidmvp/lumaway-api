"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchWalkthroughs = void 0;
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Walkthrough-specific search hook.
 *
 * Extracts the `search` param from the query and builds an OR condition
 * that matches against both the `title` column (ILIKE) and the `tags`
 * JSONB array (cast to text, ILIKE). This way users can find
 * walkthroughs by typing a tag name into the search bar.
 *
 * Replaces the generic `search({ fields: ['title'] })` hook.
 */
const searchWalkthroughs = async (context) => {
    const query = context.params?.query;
    if (!query)
        return context;
    const searchTerm = query.search;
    delete query.search;
    if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
        return context;
    }
    const term = `%${searchTerm.trim()}%`;
    // title ILIKE '%term%' OR tags::text ILIKE '%term%'
    if (!query.$and) {
        query.$and = [];
    }
    query.$and.push((0, drizzle_orm_1.sql) `(title ILIKE ${term} OR tags::text ILIKE ${term})`);
    return context;
};
exports.searchWalkthroughs = searchWalkthroughs;
