const https = require('https');
const jwt = require('jsonwebtoken');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testFullPayload() {
  const secret = 'super-secret-jwt-key';
  const token = jwt.sign(
    { sub: '65d29757-f55e-4c4d-9280-54cd2f0358d4', email: 'vumikasa6@gmail.com' },
    secret,
    { expiresIn: '7d' }
  );

  // Exact payload produced by parsed.data when all fields have content
  const payload = {
    displayName: "Phạm Văn Vũ",
    headline: "Chủ tịch & Nhà sáng lập Tập đoàn ViOne",
    jobTitle: "Tổng Giám Đốc / CEO",
    companyName: "Công ty Cổ phần Công nghệ ViOne",
    bio: "Mô tả ngắn gọn về hành trình, thế mạnh chuyên môn, quy mô doanh nghiệp và định hướng hợp tác B2B...",
    avatarUrl: "/upload/file/avatars/00000000-0000-4000-8000-000000000002-1790306428359-vcnz01.jpg",
    primaryEmail: "contact@vione.vn",
    primaryPhone: "0912 345 678",
    website: "https://vione.vn",
    linkedinUrl: "https://linkedin.com/in/username",
    address: "Số 123 Phố Trần Duy Hưng, Cầu Giấy",
    city: "Hà Nội",
    countryCode: null,
    preferredLocale: null
  };

  const bodyStr = JSON.stringify(payload);

  const req = https.request({
    hostname: '14.225.217.232',
    port: 5445,
    path: '/api/me/identity',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
      'Authorization': `Bearer ${token}`
    }
  }, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('PUT full payload Status:', res.statusCode);
      console.log('Response body:', data);
    });
  });

  req.on('error', console.error);
  req.write(bodyStr);
  req.end();
}

testFullPayload();
