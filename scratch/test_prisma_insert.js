const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const bcrypt = require('bcrypt');

async function main() {
  const fullName = 'Trần Văn Test Landing';
  const phone = '0912345678';
  const email = 'testlanding@vione.app';
  const company = 'Công ty CP Test Landing';
  const title = 'Tổng Giám Đốc';
  const clubSlug = 'ceo-1983';

  // 1. Resolve target association_id
  let assocId = null;
  const assocs = await prisma.$queryRaw`
    SELECT id FROM public.associations 
    WHERE LOWER(slug) IN (${clubSlug.toLowerCase()}, 'ceo-1983', 'ceo1983')
    LIMIT 1
  `;
  if (assocs.length > 0 && assocs[0]?.id) {
    assocId = assocs[0].id;
  }
  console.log('Resolved assocId:', assocId);

  const notesContent = `Đăng ký CLB: ${clubSlug}. Chức vụ: ${title}`;
  const now = new Date();
  const memberId = `MB${now.getTime().toString(36).toUpperCase()}`;
  const joinedAt = now.toISOString().slice(0, 10);
  const feeYear = now.getFullYear();

  let userId = null;
  try {
    const existing = await prisma.vione_users.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: email.toLowerCase() },
        ],
      },
    });

    const hashedPassword = await bcrypt.hash('12345678', 10);

    if (existing) {
      userId = existing.id;
    } else {
      userId = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO public.vione_users (id, username, email, name, password, email_verified, created_at, updated_at)
        VALUES (${userId}::uuid, ${email.toLowerCase()}, ${email.toLowerCase()}, ${fullName}, ${hashedPassword}, true, now(), now())
        ON CONFLICT (id) DO UPDATE SET password = ${hashedPassword}, email = ${email.toLowerCase()}, name = ${fullName}, updated_at = now()
      `;
    }
  } catch (uErr) {
    console.error('User account provisioning error:', uErr);
  }

  console.log('userId:', userId);

  try {
    const res = await prisma.$executeRaw`
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
        ${notesContent},
        ${userId ? userId : null}::uuid,
        ${assocId}::uuid,
        now(),
        now()
      )
    `;
    console.log('INSERT SUCCESSFUL! rowCount:', res);
  } catch (err) {
    console.error('ERROR ON PRISMA INSERT:', err);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
