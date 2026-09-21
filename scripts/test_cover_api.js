async function main() {
  const baseUrl = 'http://14.225.217.232:5003/api';
  console.log('Logging in to test remote backend endpoints...');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ceo.tongthuky@ceo1983.com',
      password: '123456',
      portal: 'association'
    })
  });
  const loginData = await loginRes.json();
  const token = loginData?.access_token || loginData?.accessToken || loginData?.token;
  console.log('Login token:', token ? 'OK' : 'FAILED');

  if (!token) return;

  console.log('\nTesting GET /members/me...');
  const meRes = await fetch(`${baseUrl}/members/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('GET /members/me status:', meRes.status);
  const meData = await meRes.json();
  console.log('Member me data:', {
    code: meData.code,
    name: meData.name,
    coverUrl: meData.coverUrl || meData.cover_url,
    avatar: meData.avatar
  });

  console.log('\nTesting PATCH /members/me/cover...');
  const patchRes = await fetch(`${baseUrl}/members/me/cover`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      coverUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200'
    })
  });
  console.log('PATCH /members/me/cover status:', patchRes.status);
  const patchData = await patchRes.json().catch(() => null);
  console.log('PATCH response:', patchData);
}

main().catch(console.error);
