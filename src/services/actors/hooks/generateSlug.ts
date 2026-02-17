import { HookContext } from '@flex-donec/core';

/**
 * Auto-generates a slug from the actor name if not provided.
 * Converts "Sales Rep" → "sales-rep"
 */
export const generateSlug = async (context: HookContext) => {
    const data = context.data;
    if (!data) return context;

    // Only auto-generate if slug is not explicitly provided
    if (!data.slug && data.name) {
        data.slug = data.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
            .replace(/\s+/g, '-')           // Spaces to hyphens
            .replace(/-+/g, '-')            // Collapse multiple hyphens
            .replace(/^-|-$/g, '');         // Trim leading/trailing hyphens
    }

    return context;
};

