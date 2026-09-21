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

  console.log('Testing DELETE /products/PROD-MU6AIYGW...');
  const delRes = await fetch(`${baseUrl}/products/PROD-MU6AIYGW`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  console.log('DELETE status:', delRes.status, await delRes.json());

  const getRes = await fetch(`${baseUrl}/products`, {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  const products = await getRes.json();
  console.log('Remaining products count:', Array.isArray(products) ? products.length : products);
}

main().catch(console.error);
