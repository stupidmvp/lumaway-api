import { HookContext } from '@flex-donec/core';
import { sql } from 'drizzle-orm';

/**
 * Extracts `tags` from the query params and converts it into a
 * JSONB @> (contains) condition so the DrizzleService `find` can
 * filter walkthroughs whose `tags` array includes ALL of the
 * requested tags.
 *
 * Query format:
 *   ?tags[]=onboarding&tags[]=ux
 *   → walkthroughs.tags @> '["onboarding","ux"]'::jsonb
 *
 * If `tags` is a single string it is normalised to an array.
 */
export const filterByTags = async (context: HookContext) => {
    const query = context.params?.query;
    if (!query) return context;

    const rawTags = query.tags;
    if (!rawTags) return context;

    // Normalise to string[]
    const tagsArray: string[] = Array.isArray(rawTags) ? rawTags : [rawTags];
    const cleaned = tagsArray
        .map((t: string) => String(t).trim().toLowerCase())
        .filter(Boolean);

    // Remove tags from the generic query so DrizzleService doesn't
    // try to match it as a plain column equality check.
    delete query.tags;

    if (cleaned.length === 0) {
        return context;
    }

    // Build a raw SQL condition: tags @> '["a","b"]'::jsonb
    const jsonLiteral = JSON.stringify(cleaned);

    // Attach as an extra WHERE condition the adapter can merge
    if (!query.$and) {
        query.$and = [];
    }
    query.$and.push(
        sql`tags @> ${jsonLiteral}::jsonb`
    );

    return context;
};
