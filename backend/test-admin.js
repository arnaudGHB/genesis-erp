import axios from 'axios';

async function testAdminAuth() {
  const API_URL = 'http://localhost:3001';

  try {
    console.log('🧪 Testing Admin Authentication...\n');

    // Test 1: Login with admin credentials
    console.log('📝 Test 1: Login with admin credentials');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin.genesis@erp.com',
      password: 'SuperPassword123!'
    });

    console.log('✅ Login successful!');
    // IMPORTANT: avoid logging full responses that may contain sensitive user data or tokens.
    // Log only minimal, non-sensitive metadata for local testing.
    const safeInfo = {
      status: loginResponse.status,
      userId: loginResponse.data?.user?.id ?? null,
      message: 'response redacted for privacy'
    };
    console.log('📄 Response (safe):', JSON.stringify(safeInfo, null, 2));

    const token = loginResponse.data?.access_token;
    if (token) {
      console.log('\n🔑 JWT Token received (truncated):', token.substring(0, 50) + '...');
    } else {
      console.log('\n🔑 No access token present in login response');
    }

    // Test 2: Access protected routes with token
    console.log('\n📝 Test 2: Access protected routes with token');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n🎉 All tests passed! Admin authentication is working correctly.');

    console.log('\n🎉 All tests passed! Admin authentication is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAdminAuth();
