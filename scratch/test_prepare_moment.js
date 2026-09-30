const http = require('http');

const payload = JSON.stringify({
  personId: 'general',
  occurredAt: new Date().toISOString(),
  eventName: 'Test Moment',
  placeLabel: 'Hanoi',
  note: 'Testing moments save',
  photoCount: 1,
  clientToken: 'd3b07384-d113-40e9-b59c-6a4a159f8166',
  visibility: 'friends',
});

// Create a JWT token for test user
const jwt = require('jsonwebtoken');
const secret = 'super-secret-jwt-key';
const token = jwt.sign({ sub: 'fbe04bac-7549-4757-a476-ff45d1c3018a', email: 'vupv090120@gmail.com' }, secret);

const req = http.request({
  hostname: 'localhost',
  port: 4001,
  path: '/api/moments',
  method: 'POST',
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
