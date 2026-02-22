import * as dotenv from 'dotenv';
dotenv.config();

import { drizzleAdapter } from '../../src/adapters';
import { systemSecrets } from '../../src/db/schema';
import { sql } from 'drizzle-orm';

const db = (drizzleAdapter as any).db;

/** Map of env var name → provider */
const KEY_CONFIG: { envVar: string; provider: 'groq' | 'google' }[] = [
    { envVar: 'GROQ_API_KEY_1', provider: 'groq' },
    { envVar: 'GROQ_API_KEY_2', provider: 'groq' },
    { envVar: 'GROQ_API_KEY_3', provider: 'groq' },
    { envVar: 'GEMINI_API_KEY_1', provider: 'google' },
    { envVar: 'GEMINI_API_KEY_2', provider: 'google' },
    { envVar: 'GEMINI_API_KEY_3', provider: 'google' },
];

export async function seed(context: any) {
    console.log('🌱 Seeding system secrets (LLM API Keys from .env)...');

    const secrets = KEY_CONFIG
        .filter(k => {
            if (!process.env[k.envVar]) {
                console.warn(`   ⚠️  ${k.envVar} not found in .env — skipping`);
                return false;
            }
            return true;
        })
        .map(k => ({
            keyName: k.envVar,
            keyValue: process.env[k.envVar]!,
            provider: k.provider,
        }));

    if (secrets.length === 0) {
        console.log('   ⏭️  No API keys found in .env — nothing to seed');
        return {};
    }

    const created = await db.insert(systemSecrets)
        .values(secrets)
        .onConflictDoUpdate({
            target: systemSecrets.keyName,
            set: {
                keyValue: sql`excluded.key_value`,
                updatedAt: new Date(),
            },
        })
        .returning();

    const groqCount = created.filter((s: any) => s.provider === 'groq').length;
    const geminiCount = created.filter((s: any) => s.provider === 'google').length;
    console.log(`   ✅ ${created.length} API keys seeded (${groqCount} Groq, ${geminiCount} Gemini)`);

    return { systemSecrets: created };
}
