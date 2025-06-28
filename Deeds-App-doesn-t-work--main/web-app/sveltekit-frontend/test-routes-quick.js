// Quick route test script
const BASE_URL = 'http://localhost:5173';

const routes = [
    '/',
    '/login',
    '/register', 
    '/dashboard',
    '/cases',
    '/criminals'
];

async function testRoutes() {
    console.log('🧪 Testing all routes...\n');
    
    for (const route of routes) {
        try {
            const response = await fetch(`${BASE_URL}${route}`);
            const status = response.status;
            const statusText = response.statusText;
            
            if (status === 200) {
                console.log(`✅ ${route}: ${status} ${statusText}`);
            } else {
                console.log(`❌ ${route}: ${status} ${statusText}`);
            }
        } catch (error) {
            console.log(`❌ ${route}: Error - ${error.message}`);
        }
    }
    
    console.log('\n🎉 Route testing complete!');
}

testRoutes();
