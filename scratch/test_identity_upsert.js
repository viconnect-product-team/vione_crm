const http = require('http');
const jwt = require('jsonwebtoken');

const secret = 'super-secret-jwt-key';
// Completely brand-new user UUID
const testUserId = '99999999-9999-4999-9999-999999999999';
const token = jwt.sign({ sub: testUserId, email: 'newuser@vione.vn' }, secret);

const payload = JSON.stringify({
  displayName: 'New CEO',
  jobTitle: 'Founder & CEO',
  companyName: 'NewTech',
  avatarUrl: 'https://vione.vn/new.png',
  coverUrl: 'https://vione.vn/cover_new.png',
  primaryPhone: '0901234567',
});

const req = http.request({
  hostname: 'localhost',
  port: 4001,
  path: '/api/me/identity',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Authorization': `Bearer ${token}`,
  },
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response body:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(payload);
req.end();
