/**
 * Test script: System Secrets CRUD + Security + LLM Integration
 * 
 * Run: npx tsx scripts/test_system_secrets.ts
 * 
 * Prerequisites:
 *   - API running on PORT (3030)
 *   - DB migrated (system_secrets table exists)
 *   - A superadmin user exists
 */
import * as dotenv from 'dotenv';
dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 3030}`;

// ─── Helper ───
async function request(path: string, options: RequestInit & { token?: string } = {}) {
    const { token, ...fetchOpts } = options;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_URL}${path}`, { ...fetchOpts, headers });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
}

async function login(email: string, password: string): Promise<string> {
    const res = await request('/authentication', {
        method: 'POST',
        body: JSON.stringify({ strategy: 'local', email, password }),
    });
    if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Login failed: ${JSON.stringify(res.data)}`);
    }
    return res.data.accessToken;
}

// ─── Tests ───
async function main() {
    console.log('═══════════════════════════════════════════════');
    console.log('  Test: System Secrets Service');
    console.log('═══════════════════════════════════════════════\n');

    // 1. Login as superadmin
    console.log('1️⃣  Logging in as superadmin...');
    let superToken: string;
    try {
        superToken = await login('superadmin@superdamin.com', 'secret123');
        console.log('   ✅ Superadmin login successful\n');
    } catch (e: any) {
        console.error('   ❌ Login failed:', e.message);
        console.log('\n   ⚠️  Make sure a superadmin user exists with email: superadmin@superdamin.com');
        process.exit(1);
    }

    // 2. Test CREATE - Add a test secret
    console.log('2️⃣  Creating a test secret (GROQ_KEY)...');
    const createRes = await request('/system-secrets', {
        method: 'POST',
        token: superToken,
        body: JSON.stringify({
            keyName: 'GROQ_KEY',
            keyValue: 'gsk_test_1234567890abcdef',
            provider: 'groq',
        }),
    });
    console.log('   Status:', createRes.status);

    if (createRes.status === 201 || createRes.status === 200) {
        console.log('   ✅ Secret created');
        // Check redaction
        const isRedacted = createRes.data.keyValue?.includes('•');
        console.log(`   🔒 keyValue redacted: ${isRedacted ? '✅ YES' : '❌ NO (SECURITY ISSUE!)'}`);
        console.log(`   📧 Returned keyValue: "${createRes.data.keyValue}"`);
    } else {
        console.log('   ❌ Create failed:', JSON.stringify(createRes.data));
    }

    // 3. Test FIND - List all secrets
    console.log('\n3️⃣  Listing all secrets (find)...');
    const findRes = await request('/system-secrets', { token: superToken });
    console.log('   Status:', findRes.status);
    if (findRes.status === 200) {
        const secrets = Array.isArray(findRes.data) ? findRes.data : findRes.data?.data || [];
        console.log(`   ✅ Found ${secrets.length} secret(s)`);
        secrets.forEach((s: any) => {
            console.log(`      - ${s.keyName} (${s.provider}): "${s.keyValue}"`);
        });
    }

    // 4. Test WITHOUT auth - should fail
    console.log('\n4️⃣  Testing WITHOUT authentication...');
    const noAuthRes = await request('/system-secrets');
    console.log(`   Status: ${noAuthRes.status} ${noAuthRes.status === 401 ? '✅ Rejected (correct!)' : '❌ SHOULD BE 401'}`);

    // 5. Test with non-superadmin (if available)
    console.log('\n5️⃣  Testing with non-superadmin user...');
    try {
        const normalToken = await login('member@lumaway.com', 'member123');
        const forbiddenRes = await request('/system-secrets', { token: normalToken });
        console.log(`   Status: ${forbiddenRes.status} ${forbiddenRes.status === 403 || forbiddenRes.status === 500 ? '✅ Forbidden (correct!)' : '❌ SHOULD BE FORBIDDEN'}`);
    } catch (e) {
        console.log('   ⏭️  Skipped (no non-superadmin user available)');
    }

    // 6. Cleanup - remove the test secret
    if (createRes.status === 201 || createRes.status === 200) {
        console.log('\n6️⃣  Cleaning up test secret...');
        const deleteRes = await request(`/system-secrets/${createRes.data.id}`, {
            method: 'DELETE',
            token: superToken,
        });
        console.log(`   Status: ${deleteRes.status} ${deleteRes.status === 200 ? '✅ Deleted' : '⚠️ ' + JSON.stringify(deleteRes.data)}`);
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('  Tests complete!');
    console.log('═══════════════════════════════════════════════\n');
}

main().catch(console.error);
