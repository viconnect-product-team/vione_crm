async function main() {
  const baseUrl = 'http://14.225.217.232:5003/api';
  console.log('Logging in to remote backend...');
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
  console.log('Login status:', loginRes.status);
  const token = loginData?.access_token || loginData?.accessToken || loginData?.token;
  if (!token) {
    console.error('Failed to get token:', loginData);
    return;
  }
  console.log('Token received successfully!');

  console.log('Attempting to create product via POST /products...');
  const postRes = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Gói Chuyển Đổi Số Doanh Nghiệp 4.0 - Test',
      title: 'Gói Chuyển Đổi Số Doanh Nghiệp 4.0 - Test',
      description: 'Hỗ trợ tự động hóa quy trình quản trị doanh nghiệp hội viên CEO 1983',
      company: 'Tập đoàn Công nghệ Alpha',
      category: 'Công nghệ & Phần mềm',
      price: 15000000,
      originalPrice: 20000000,
      memberPrice: 15000000,
      unit: 'Gói',
      currency: 'VND',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
      imageUrls: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71']
    })
  });

  const postData = await postRes.json();
  console.log('Create Product status:', postRes.status);
  console.log('Create Product response:', postData);

  console.log('\nFetching products via GET /products...');
  const getRes = await fetch(`${baseUrl}/products`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const products = await getRes.json();
  console.log('Total products returned:', Array.isArray(products) ? products.length : products);
  if (Array.isArray(products) && products.length > 0) {
    console.log('First 2 products:', JSON.stringify(products.slice(0, 2), null, 2));
  }
}

main().catch(console.error);
