// Native fetch is available in Node 18+
const API_URL = 'http://localhost:3001';

async function verifyAuth() {
    console.log('🧪 Starting Auth Verification...');

    // 1. Login as Super Admin
    console.log('\n🔐 1. Logging in as Super Admin (Fabian)...');
    const superParams = {
        strategy: 'local',
        email: 'fabiandonec@gmail.com',
        password: 'password123'
    };

    let superToken = '';
    try {
        const res = await fetch(`${API_URL}/authentication`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(superParams)
        });
        const data: any = await res.json();

        if ((res.status === 201 || res.status === 200) && data.accessToken) {
            console.log('✅ Super Admin Login Successful');
            superToken = data.accessToken;
        } else {
            console.error('❌ Super Admin Login Failed:', data);
            return;
        }
    } catch (e: any) {
        console.error('❌ Connection Failed. Is the server running?', e.message);
        return;
    }

    // 2. Login as Org Admin
    console.log('\n🔐 2. Logging in as Org Admin...');
    const adminParams = {
        strategy: 'local',
        email: 'admin@lumaway.com',
        password: 'password123'
    };

    let adminToken = '';
    try {
        const res = await fetch(`${API_URL}/authentication`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminParams)
        });
        const data: any = await res.json();

        if ((res.status === 201 || res.status === 200) && data.accessToken) {
            console.log('✅ Org Admin Login Successful');
            adminToken = data.accessToken;
        } else {
            console.error('❌ Org Admin Login Failed:', data);
        }
    } catch (e) {
        console.error('❌ Org Admin Login Exception', e);
    }

    // 3. Verify Access - Super Admin Listing Organizations
    console.log('\n📂 3. Verifying Super Admin Access (List Organizations)...');
    try {
        const res = await fetch(`${API_URL}/organizations`, {
            headers: { 'Authorization': `Bearer ${superToken}` }
        });
        const data: any = await res.json();

        if (res.status === 200 && Array.isArray(data.data)) {
            console.log(`✅ Super Admin can see ${data.data.length} organizations.`);
            console.log('   Orgs:', data.data.map((o: any) => o.name).join(', '));
        } else {
            console.error('❌ Super Admin Access Failed:', data);
        }
    } catch (e) {
        console.error('❌ Verification Exception', e);
    }

    // 4. Verify Access - Org Admin Listing Projects
    console.log('\n📂 4. Verifying Org Admin Access (List Projects)...');
    try {
        const res = await fetch(`${API_URL}/projects`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data: any = await res.json();

        if (res.status === 200 && Array.isArray(data.data)) {
            console.log(`✅ Org Admin can see ${data.data.length} projects.`);
        } else {
            console.error('❌ Org Admin Access Failed:', data);
        }
    } catch (e) {
        console.error('❌ Verification Exception', e);
    }
}

verifyAuth();
