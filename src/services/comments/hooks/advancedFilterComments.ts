import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters';
import { comments } from '../../../db/schema';
import { eq, and, ilike, gte, lte, isNull, inArray, asc, desc, SQL } from 'drizzle-orm';

/**
 * Before find hook for comments.
 *
 * Intercepts custom filter params (`type`, `search`, `authorId`, `dateFrom`, `dateTo`)
 * and performs a server-side query that:
 *   1. Finds ROOT comments matching all filters (parentId IS NULL)
 *   2. Fetches ALL replies for those matching root comments (preserving threading)
 *   3. Sets context.result to bypass the default DrizzleService find.
 *
 * The hook activates when ANY of these filters are present. This ensures the
 * root+replies pattern is always used, so threading is preserved even when
 * filtering by type alone (e.g. showing only corrections still includes all
 * their replies regardless of reply type).
 *
 * If none of the filters are present, falls through to the default DrizzleService
 * behaviour.
 */
export const advancedFilterComments = async (context: HookContext) => {
    const query = context.params?.query || {};

    // Extract custom filter params
    const search = query.search;
    const authorId = query.authorId;
    const dateFrom = query.dateFrom;
    const dateTo = query.dateTo;

    // Remove custom params so DrizzleService doesn't choke on them
    delete query.search;
    delete query.authorId;
    delete query.dateFrom;
    delete query.dateTo;

    const hasFilters = search || authorId || dateFrom || dateTo || query.type;

    if (!hasFilters) return context;

    // ── Build WHERE conditions for ROOT comments ──────────────────────

    const conditions: SQL[] = [];

    // Required: projectId
    if (query.projectId) {
        conditions.push(eq(comments.projectId, query.projectId));
    }

    // Status (usually set by filterActiveComments hook)
    if (query.status) {
        conditions.push(eq(comments.status, query.status));
    }

    // Scope filters
    if (query.targetType) {
        conditions.push(eq(comments.targetType, query.targetType));
    }
    if (query.targetId) {
        conditions.push(eq(comments.targetId, query.targetId));
    }
    if (query.stepId) {
        conditions.push(eq(comments.stepId, query.stepId));
    }

    // Type filter (comment | correction | announcement)
    if (query.type) {
        conditions.push(eq(comments.type, query.type));
    }

    // Only root comments (parentId IS NULL)
    conditions.push(isNull(comments.parentId));

    // ── Advanced filters ──────────────────────────────────────────────

    if (authorId) {
        conditions.push(eq(comments.userId, authorId));
    }

    if (search && typeof search === 'string' && search.trim()) {
        conditions.push(ilike(comments.content, `%${search.trim()}%`));
    }

    if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        conditions.push(gte(comments.createdAt, from));
    }

    if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        conditions.push(lte(comments.createdAt, to));
    }

    // ── Pagination & sorting ──────────────────────────────────────────

    const limit = Number(query.$limit) || 500;

    // Determine sort direction from query.$sort
    let orderFn = asc(comments.createdAt); // default ascending
    const sortParam = query.$sort;
    if (sortParam && typeof sortParam === 'object') {
        const entries = Object.entries(sortParam);
        if (entries.length > 0) {
            const [, dir] = entries[0];
            if (String(dir) === '-1' || (dir as any) === 'desc') {
                orderFn = desc(comments.createdAt);
            }
        }
    }

    // ── Execute queries ───────────────────────────────────────────────

    // 1. Find matching root comments
    const rootResults = await db
        .select()
        .from(comments)
        .where(and(...conditions))
        .orderBy(orderFn)
        .limit(limit);

    const rootIds = rootResults.map((r) => r.id);

    // 2. Find ALL replies for matching roots (unfiltered — preserves threading)
    let replyResults: (typeof rootResults)[number][] = [];
    if (rootIds.length > 0) {
        const replyConditions: SQL[] = [
            inArray(comments.parentId, rootIds),
        ];

        // Respect status filter for replies too
        if (query.status) {
            replyConditions.push(eq(comments.status, query.status));
        }

        replyResults = await db
            .select()
            .from(comments)
            .where(and(...replyConditions))
            .orderBy(asc(comments.createdAt));
    }

    // ── Set result to bypass DrizzleService ────────────────────────────

    const allResults = [...rootResults, ...replyResults];

    context.result = {
        data: allResults,
        total: rootResults.length,
        limit,
        skip: 0,
    };

    return context;
};

