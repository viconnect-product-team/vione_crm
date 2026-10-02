// Test general RESTful standards and error handling
const BASE_URL = 'http://127.0.0.1:4001/api';

async function testGeneralRest() {
  console.log('Testing general RESTful standards and error handling...');

  // Test root GET /api
  const rRoot = await fetch(`${BASE_URL}`);
  const dRoot = await rRoot.json().catch(() => null);
  console.log('GET /api:', rRoot.status, dRoot);

  // Test 401 Unauthorized for protected endpoint without token
  const rMe = await fetch(`${BASE_URL}/auth/me`);
  const dMe = await rMe.json().catch(() => null);
  console.log('GET /api/auth/me (No Auth):', rMe.status, dMe);

  // Test 404 Not Found for non-existent endpoint
  const r404 = await fetch(`${BASE_URL}/non-existent-endpoint-${Date.now()}`);
  const d404 = await r404.json().catch(() => null);
  console.log('GET 404 Route:', r404.status, d404);

  // Test 405 Method Not Allowed or 404 for unmapped method
  const rDeleteRoot = await fetch(`${BASE_URL}/auth/login`, { method: 'DELETE' });
  const dDeleteRoot = await rDeleteRoot.json().catch(() => null);
  console.log('DELETE /api/auth/login:', rDeleteRoot.status, dDeleteRoot);
}

testGeneralRest().catch(console.error);
