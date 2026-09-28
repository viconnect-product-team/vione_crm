const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testApi() {
  // Login first
  const loginData = JSON.stringify({
    email: 'vumikasa6@gmail.com',
    password: 'password123' // thử password phổ biến hoặc xem hash
  });

  // Hoặc tạo một JWT token với secret của server:
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'super-secret-jwt-key';
  
  // Test token với user id của vumikasa6
  const token = jwt.sign(
    { sub: '65d29757-f55e-4c4d-9280-54cd2f0358d4', email: 'vumikasa6@gmail.com' },
    secret,
    { expiresIn: '7d' }
  );
  console.log('Generated token for 65d29757-f55e-4c4d-9280-54cd2f0358d4');

  // Gọi thử PUT /api/me/identity
  const putPayload = JSON.stringify({
    displayName: 'Phạm Văn Vũ Test',
    headline: 'CEO',
    avatarUrl: '/upload/file/avatars/test.jpg'
  });

  const options = {
    hostname: '14.225.217.232',
    port: 5445,
    path: '/api/me/identity',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(putPayload),
      'Authorization': `Bearer ${token}`
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('PUT /api/me/identity Status:', res.statusCode);
      console.log('Response body:', data);
    });
  });

  req.on('error', err => console.error('PUT req error:', err));
  req.write(putPayload);
  req.end();

  // Gọi thử POST /api/me/identity/share-link
  const shareReq = https.request({
    hostname: '14.225.217.232',
    port: 5445,
    path: '/api/me/identity/share-link',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('POST /api/me/identity/share-link Status:', res.statusCode);
      console.log('Response body:', data);
    });
  });

  shareReq.on('error', err => console.error('Share req error:', err));
  shareReq.end();
}

testApi();
