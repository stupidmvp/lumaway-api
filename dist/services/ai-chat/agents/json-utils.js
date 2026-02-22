"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runJsonAgent = runJsonAgent;
function extractJsonCandidate(text) {
    const cleaned = text.replace(/\`\`\`json\n?|\n?\`\`\`/g, '').trim();
    const direct = cleaned.trim();
    if (direct.startsWith('{') && direct.endsWith('}'))
        return direct;
    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? match[0] : null;
}
async function runJsonAgent(runner, schema, fallback) {
    try {
        const raw = await runner();
        const candidate = extractJsonCandidate(raw);
        if (!candidate)
            return fallback;
        const parsed = JSON.parse(candidate);
        const validated = schema.safeParse(parsed);
        if (!validated.success)
            return fallback;
        return validated.data;
    }
    catch {
        return fallback;
    }
}
