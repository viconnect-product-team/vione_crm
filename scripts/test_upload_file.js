async function main() {
  const baseUrl = 'http://14.225.217.232:5003/api';
  console.log('Logging in to test upload...');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ceo.tongthuky@ceo1983.com',
      password: '123456',
      portal: 'association'
    })
  });
  const { access_token } = await loginRes.json();
  console.log('Got token, testing file upload...');

  const formData = new FormData();
  const blob = new Blob(['test image data'], { type: 'image/png' });
  formData.append('file', blob, 'test_cover.png');

  const uploadRes = await fetch(`${baseUrl}/upload/file`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${access_token}` },
    body: formData
  });

  console.log('Upload status:', uploadRes.status);
  const text = await uploadRes.text();
  console.log('Upload response:', text);
}

main().catch(console.error);
