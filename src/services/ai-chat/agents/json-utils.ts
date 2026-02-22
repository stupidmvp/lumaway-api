import { z } from 'zod';

function extractJsonCandidate(text: string): string | null {
    const cleaned = text.replace(/\`\`\`json\n?|\n?\`\`\`/g, '').trim();
    const direct = cleaned.trim();
    if (direct.startsWith('{') && direct.endsWith('}')) return direct;
    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? match[0] : null;
}

export async function runJsonAgent<T>(
    runner: () => Promise<string>,
    schema: z.ZodSchema<T>,
    fallback: T,
): Promise<T> {
    try {
        const raw = await runner();
        const candidate = extractJsonCandidate(raw);
        if (!candidate) return fallback;
        const parsed = JSON.parse(candidate);
        const validated = schema.safeParse(parsed);
        if (!validated.success) return fallback;
        return validated.data;
    } catch {
        return fallback;
    }
}

