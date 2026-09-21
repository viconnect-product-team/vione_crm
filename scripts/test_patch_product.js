async function main() {
  const baseUrl = 'http://14.225.217.232:5003/api';
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

  // Test PATCH update product
  console.log('Testing PATCH /products/PROD-MU6AIYGW...');
  const patchRes = await fetch(`${baseUrl}/products/PROD-MU6AIYGW`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    body: JSON.stringify({
      name: 'Gói Chuyển Đổi Số Doanh Nghiệp 4.0 - ĐÃ CẬP NHẬT',
      price: 18000000,
      originalPrice: 22000000
    })
  });
  console.log('PATCH status:', patchRes.status, await patchRes.json());

  // Test GET to verify update
  const getRes = await fetch(`${baseUrl}/products`, {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  const products = await getRes.json();
  console.log('Updated product:', products.find(p => p.id === 'PROD-MU6AIYGW'));
}

main().catch(console.error);
