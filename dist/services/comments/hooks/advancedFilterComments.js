"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedFilterComments = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
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
const advancedFilterComments = async (context) => {
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
    if (!hasFilters)
        return context;
    // ── Build WHERE conditions for ROOT comments ──────────────────────
    const conditions = [];
    // Required: projectId
    if (query.projectId) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.comments.projectId, query.projectId));
    }
    // Status (usually set by filterActiveComments hook)
    if (query.status) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.comments.status, query.status));
    }
    // Scope filters
    if (query.targetType) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.comments.targetType, query.targetType));
    }
    if (query.targetId) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.comments.targetId, query.targetId));
    }
    if (query.stepId) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.comments.stepId, query.stepId));
    }
    // Type filter (comment | correction | announcement)
    if (query.type) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.comments.type, query.type));
    }
    // Only root comments (parentId IS NULL)
    conditions.push((0, drizzle_orm_1.isNull)(schema_1.comments.parentId));
    // ── Advanced filters ──────────────────────────────────────────────
    if (authorId) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.comments.userId, authorId));
    }
    if (search && typeof search === 'string' && search.trim()) {
        conditions.push((0, drizzle_orm_1.ilike)(schema_1.comments.content, `%${search.trim()}%`));
    }
    if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        conditions.push((0, drizzle_orm_1.gte)(schema_1.comments.createdAt, from));
    }
    if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        conditions.push((0, drizzle_orm_1.lte)(schema_1.comments.createdAt, to));
    }
    // ── Pagination & sorting ──────────────────────────────────────────
    const limit = Number(query.$limit) || 500;
    // Determine sort direction from query.$sort
    let orderFn = (0, drizzle_orm_1.asc)(schema_1.comments.createdAt); // default ascending
    const sortParam = query.$sort;
    if (sortParam && typeof sortParam === 'object') {
        const entries = Object.entries(sortParam);
        if (entries.length > 0) {
            const [, dir] = entries[0];
            if (String(dir) === '-1' || dir === 'desc') {
                orderFn = (0, drizzle_orm_1.desc)(schema_1.comments.createdAt);
            }
        }
    }
    // ── Execute queries ───────────────────────────────────────────────
    // 1. Find matching root comments
    const rootResults = await adapters_1.db
        .select()
        .from(schema_1.comments)
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy(orderFn)
        .limit(limit);
    const rootIds = rootResults.map((r) => r.id);
    // 2. Find ALL replies for matching roots (unfiltered — preserves threading)
    let replyResults = [];
    if (rootIds.length > 0) {
        const replyConditions = [
            (0, drizzle_orm_1.inArray)(schema_1.comments.parentId, rootIds),
        ];
        // Respect status filter for replies too
        if (query.status) {
            replyConditions.push((0, drizzle_orm_1.eq)(schema_1.comments.status, query.status));
        }
        replyResults = await adapters_1.db
            .select()
            .from(schema_1.comments)
            .where((0, drizzle_orm_1.and)(...replyConditions))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.comments.createdAt));
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
exports.advancedFilterComments = advancedFilterComments;
