import axios from 'axios';

async function testAdminAuth() {
  const API_URL = 'https://genesis-erp-backend.onrender.com';

  try {
    console.log('🧪 Testing Admin Authentication...\n');

    // Test 1: Login with admin credentials
    console.log('📝 Test 1: Login with admin credentials');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin.genesis@erp.com',
      password: 'SuperPassword123!'
    });

    console.log('✅ Login successful!');
    console.log('📄 Response:', JSON.stringify(loginResponse.data, null, 2));

    const token = loginResponse.data.access_token;
    console.log('\n🔑 JWT Token received:', token.substring(0, 50) + '...');

    // Test 2: Access protected routes with token
    console.log('\n📝 Test 2: Access protected routes with token');

    const headers = { Authorization: `Bearer ${token}` };

    const productsResponse = await axios.get(`${API_URL}/products`, { headers });
    console.log('✅ Products endpoint accessible');
    console.log('📦 Products count:', productsResponse.data.length);

    const stocksResponse = await axios.get(`${API_URL}/stocks`, { headers });
    console.log('✅ Stocks endpoint accessible');
    console.log('📊 Stocks count:', stocksResponse.data.length);

    console.log('\n🎉 All tests passed! Admin authentication is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAdminAuth();
