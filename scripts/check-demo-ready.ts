import { db } from '../src/adapters';
import { projects, organizations, subscriptionPlans, apiKeys, walkthroughs } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function checkDemoReady() {
    console.log('🔍 Checking if AI Chat demo is ready...\n');

    // Check for projects with API keys
    const projectsWithKeys = await db
        .select({
            projectId: projects.id,
            projectName: projects.name,
            orgName: organizations.name,
            orgId: organizations.id,
            tier: subscriptionPlans.tier,
            apiKey: apiKeys.key,
        })
        .from(projects)
        .innerJoin(organizations, eq(projects.organizationId, organizations.id))
        .leftJoin(subscriptionPlans, eq(organizations.planId, subscriptionPlans.id))
        .leftJoin(apiKeys, eq(apiKeys.projectId, projects.id))
        .limit(3);

    if (projectsWithKeys.length === 0) {
        console.log('❌ No projects found with API keys');
        return;
    }

    console.log('✅ Projects with API keys:');
    for (const proj of projectsWithKeys) {
        if (!proj.apiKey) {
            console.log(`   - ${proj.projectName} (org: ${proj.orgName}) - ⚠️  NO API KEY`);
            continue;
        }

        // Count published walkthroughs
        const wtCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(walkthroughs)
            .where(eq(walkthroughs.projectId, proj.projectId));

        const count = Number(wtCount[0]?.count || 0);

        console.log(`   - ${proj.projectName} (org: ${proj.orgName})`);
        console.log(`     Tier: ${proj.tier || 'none'}`);
        console.log(`     API Key: ${proj.apiKey?.substring(0, 20)}...`);
        console.log(`     Published walkthroughs: ${count}`);
        console.log('');
    }

    // Show test curl command
    const firstProject = projectsWithKeys.find(p => p.apiKey);
    if (firstProject?.apiKey) {
        console.log('🧪 Test command:');
        console.log(`
curl -X POST http://localhost:3001/ai-chat \\
  -H "x-api-key: ${firstProject.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "¿Qué walkthroughs hay disponibles?"}'
        `);
    }
}

checkDemoReady().catch(console.error);
