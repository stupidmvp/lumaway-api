import { drizzleAdapter } from '../../src/adapters';
import { subscriptionPlans, organizations } from '../../src/db/schema';
import { sql } from 'drizzle-orm';

const db = (drizzleAdapter as any).db;

const PLANS = [
    {
        name: 'Free',
        tier: 'free' as const,
        llmModels: ['gemini-1.5-flash', 'llama-3.1-70b-versatile'],
        maxRpm: 15,
        maxTokensMonth: 50000,
    },
    {
        name: 'Pro',
        tier: 'pro' as const,
        llmModels: ['gemini-1.5-pro', 'gpt-4o-mini', 'llama-3.1-70b-versatile'],
        maxRpm: 60,
        maxTokensMonth: 500000,
    },
    {
        name: 'Enterprise',
        tier: 'enterprise' as const,
        llmModels: [], // Enterprise can use any model via their own keys
        maxRpm: 120,
        maxTokensMonth: null, // Unlimited
    },
];

export async function seed(context: any) {
    console.log('🌱 Seeding subscription plans...');

    const created = await db.insert(subscriptionPlans)
        .values(PLANS)
        .onConflictDoNothing()
        .returning();

    const freePlan = created.find((p: any) => p.tier === 'free');

    // Assign free plan to all existing organizations that don't have a plan
    if (freePlan) {
        await db.update(organizations)
            .set({ planId: freePlan.id })
            .where(sql`${organizations.planId} IS NULL`);
        console.log(`   ✅ Assigned Free plan to existing organizations`);
    }

    console.log(`   ✅ ${created.length} subscription plans seeded`);

    return {
        subscriptionPlans: {
            free: freePlan,
            pro: created.find((p: any) => p.tier === 'pro'),
            enterprise: created.find((p: any) => p.tier === 'enterprise'),
        },
    };
}
