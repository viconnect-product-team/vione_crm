const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  const fullName = 'Nguyễn Đăng Ký Test Mới';
  const phone = '0987654321';
  const email = 'dangkytestmoi@vione.app';
  const company = 'Công ty TNHH Phát Triển 1983';
  const title = 'Giám Đốc Điều Hành';
  const clubSlug = 'ceo-1983';

  let assocId = null;
  const assocs = await prisma.$queryRaw`
    SELECT id FROM public.associations 
    WHERE LOWER(slug) IN (${clubSlug.toLowerCase()}, 'ceo-1983', 'ceo1983')
    LIMIT 1
  `;
  if (assocs.length > 0 && assocs[0]?.id) {
    assocId = assocs[0].id;
  }

  const now = new Date();
  const memberId = `MB${now.getTime().toString(36).toUpperCase()}`;
  const joinedAt = now.toISOString().slice(0, 10);
  const feeYear = now.getFullYear();

  const userId = crypto.randomUUID();

  // Test the exact new logic
  await prisma.$executeRaw`
    INSERT INTO auth.users (id, email, role)
    VALUES (${userId}::uuid, ${email.toLowerCase()}, 'authenticated')
    ON CONFLICT (id) DO UPDATE SET email = ${email.toLowerCase()}
  `;

  let verifiedUserId = null;
  const authUserCheck = await prisma.$queryRaw`
    SELECT id FROM auth.users WHERE id = ${userId}::uuid LIMIT 1
  `;
  if (authUserCheck.length > 0) {
    verifiedUserId = userId;
  }

  const targetAssocUuid = assocId || (await prisma.$queryRaw`SELECT id FROM public.associations LIMIT 1`.then(r => r[0]?.id));

  const insertRes = await prisma.$executeRaw`
    INSERT INTO public.members (
      id, code, name, contact, email, phone, type, level, industry, region, status, joined_at, fee_year, fee_paid, about, user_id, association_id, created_at, updated_at
    ) VALUES (
      ${memberId},
      '',
      ${company},
      ${fullName},
      ${email},
      ${phone},
      'company',
      'memberLevel.medium',
      'ind.it',
      'region.north',
      'pending',
      ${joinedAt}::date,
      ${feeYear},
      false,
      'Test notes',
      ${verifiedUserId ? verifiedUserId : null}::uuid,
      ${targetAssocUuid}::uuid,
      now(),
      now()
    )
  `;

  console.log('INSERT RESULT:', insertRes);

  const check = await prisma.$queryRaw`
    SELECT id, name, contact, email, phone, status FROM public.members WHERE id = ${memberId}
  `;
  console.log('CHECK FROM DB:', check);

  // Clean up test record
  await prisma.$executeRaw`DELETE FROM public.members WHERE id = ${memberId}`;
  await prisma.$executeRaw`DELETE FROM auth.users WHERE id = ${userId}::uuid`;
  console.log('CLEANED UP TEST DATA');

  await prisma.$disconnect();
}

main().catch(console.error);
