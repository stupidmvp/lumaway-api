"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOrchestration = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `patch` and `update` on `walkthroughs`.
 *
 * Validates orchestration structure when publishing:
 * - Orchestrators must have at least one child OR a nextWalkthroughId
 * - Referenced walkthroughs (parentId, previousWalkthroughId, nextWalkthroughId) must exist and be published
 *
 * Only runs when isPublished is being set to true.
 */
const validateOrchestration = async (context) => {
    const { data, method, params } = context;
    const walkthroughId = params?.route?.id;
    // Only validate on patch/update
    if (method !== 'patch' && method !== 'update') {
        return context;
    }
    // Only validate when publishing (isPublished: true)
    if (data.isPublished !== true) {
        return context;
    }
    if (!walkthroughId) {
        return context;
    }
    // Get current walkthrough state (merge with data to get final state)
    const [current] = await adapters_1.db
        .select()
        .from(schema_1.walkthroughs)
        .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, walkthroughId))
        .limit(1);
    if (!current) {
        throw new Error('Walkthrough not found');
    }
    // Merge current state with updates
    const finalState = {
        ...current,
        ...data,
    };
    const steps = finalState.steps;
    const stepsArray = Array.isArray(steps) ? steps : [];
    const isOrchestrator = stepsArray.length === 0;
    // ── Validation 1: Orchestrators must have children or nextWalkthroughId ──
    if (isOrchestrator) {
        // Check if it has children
        const children = await adapters_1.db
            .select({ id: schema_1.walkthroughs.id })
            .from(schema_1.walkthroughs)
            .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.parentId, walkthroughId))
            .limit(1);
        const hasChildren = children.length > 0;
        const hasNextWalkthrough = !!finalState.nextWalkthroughId;
        if (!hasChildren && !hasNextWalkthrough) {
            throw new Error('Los walkthroughs orquestadores deben tener al menos un walkthrough hijo o un siguiente walkthrough (nextWalkthroughId) antes de publicarse.');
        }
    }
    // ── Validation 2: parentId must exist and be published ──
    if (finalState.parentId) {
        const [parent] = await adapters_1.db
            .select({ id: schema_1.walkthroughs.id, isPublished: schema_1.walkthroughs.isPublished })
            .from(schema_1.walkthroughs)
            .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, finalState.parentId))
            .limit(1);
        if (!parent) {
            throw new Error(`El walkthrough padre (parentId: ${finalState.parentId}) no existe.`);
        }
        if (!parent.isPublished) {
            throw new Error(`El walkthrough padre "${parent.id}" debe estar publicado antes de publicar este walkthrough hijo.`);
        }
    }
    // ── Validation 3: previousWalkthroughId must exist and be published ──
    if (finalState.previousWalkthroughId) {
        const [previous] = await adapters_1.db
            .select({ id: schema_1.walkthroughs.id, title: schema_1.walkthroughs.title, isPublished: schema_1.walkthroughs.isPublished })
            .from(schema_1.walkthroughs)
            .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, finalState.previousWalkthroughId))
            .limit(1);
        if (!previous) {
            throw new Error(`El walkthrough anterior (previousWalkthroughId: ${finalState.previousWalkthroughId}) no existe.`);
        }
        if (!previous.isPublished) {
            throw new Error(`El walkthrough anterior "${previous.title || previous.id}" debe estar publicado antes de publicar este walkthrough.`);
        }
    }
    // ── Validation 4: nextWalkthroughId must exist and be published ──
    if (finalState.nextWalkthroughId) {
        const [next] = await adapters_1.db
            .select({ id: schema_1.walkthroughs.id, title: schema_1.walkthroughs.title, isPublished: schema_1.walkthroughs.isPublished })
            .from(schema_1.walkthroughs)
            .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, finalState.nextWalkthroughId))
            .limit(1);
        if (!next) {
            throw new Error(`El walkthrough siguiente (nextWalkthroughId: ${finalState.nextWalkthroughId}) no existe.`);
        }
        if (!next.isPublished) {
            throw new Error(`El walkthrough siguiente "${next.title || next.id}" debe estar publicado antes de publicar este walkthrough.`);
        }
    }
    // ── Validation 5: Prevent circular references ──
    // Check if nextWalkthroughId creates a cycle
    if (finalState.nextWalkthroughId) {
        const visited = new Set([walkthroughId]);
        let currentId = finalState.nextWalkthroughId;
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const [wt] = await adapters_1.db
                .select({ nextWalkthroughId: schema_1.walkthroughs.nextWalkthroughId })
                .from(schema_1.walkthroughs)
                .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, currentId))
                .limit(1);
            if (!wt)
                break;
            currentId = wt.nextWalkthroughId;
            // If we come back to the original walkthrough, it's a cycle
            if (currentId === walkthroughId) {
                throw new Error('Se detectó una referencia circular en la secuencia de walkthroughs. Un walkthrough no puede referenciarse a sí mismo directa o indirectamente.');
            }
        }
    }
    return context;
};
exports.validateOrchestration = validateOrchestration;
