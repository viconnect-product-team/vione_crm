const { PrismaClient } = require('@prisma/client');

async function testNewUser() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&pgbouncer=true'
      }
    }
  });

  // Tìm 1 user trong auth.users chưa có trong business_identities
  const usersWithoutIdentity = await prisma.$queryRaw`
    SELECT u.id, u.email 
    FROM auth.users u
    LEFT JOIN public.business_identities b ON b.owner_user_id = u.id
    WHERE b.id IS NULL
    LIMIT 5
  `;
  console.log('Users without identity in vione_project:', usersWithoutIdentity);

  if (usersWithoutIdentity.length > 0) {
    const testUser = usersWithoutIdentity[0];
    console.log('Testing with user:', testUser);

    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'super-secret-jwt-key';
    const token = jwt.sign(
      { sub: testUser.id, email: testUser.email },
      secret,
      { expiresIn: '7d' }
    );

    const https = require('https');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const putPayload = JSON.stringify({
      displayName: 'Test New User',
      headline: 'Manager',
      avatarUrl: '/upload/file/avatars/new.jpg'
    });

    const req = https.request({
      hostname: '14.225.217.232',
      port: 5445,
      path: '/api/me/identity',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(putPayload),
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('PUT /api/me/identity for NEW user status:', res.statusCode);
        console.log('Response:', data);
      });
    });

    req.on('error', console.error);
    req.write(putPayload);
    req.end();
  }

  await prisma.$disconnect();
}

testNewUser();
