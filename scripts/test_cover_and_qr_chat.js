const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database via Prisma...');

  // 1. Verify user & member
  const users = await prisma.$queryRawUnsafe(`
    SELECT u.id, u.email, u.cover_url, m.id as member_id, m.code, m.name, m.cover_url as member_cover_url
    FROM public.vione_users u
    LEFT JOIN public.members m ON m.user_id = u.id OR m.id = u.id::text OR LOWER(m.email) = LOWER(u.email)
    WHERE u.email = 'ceo.tongthuky@ceo1983.com'
    LIMIT 1;
  `);

  if (!users || users.length === 0) {
    console.log('User not found');
    return;
  }
  const user = users[0];
  console.log('Found user & member:', {
    userId: user.id,
    email: user.email,
    userCover: user.cover_url,
    memberId: user.member_id,
    memberCode: user.code,
    memberName: user.name,
    memberCover: user.member_cover_url
  });

  // 2. Update cover_url
  const sampleCover = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200';
  await prisma.$executeRawUnsafe(
    `UPDATE public.vione_users SET cover_url = $1, updated_at = NOW() WHERE id = $2::uuid`,
    sampleCover,
    user.id
  );
  await prisma.$executeRawUnsafe(
    `UPDATE public.members SET cover_url = $1, updated_at = NOW() WHERE user_id = $2::uuid OR id = $2`,
    sampleCover,
    user.id
  );
  console.log('Updated cover_url successfully in both tables!');

  // 3. Verify
  const verified = await prisma.$queryRawUnsafe(`
    SELECT u.id, u.email, u.cover_url as user_cover, m.cover_url as member_cover
    FROM public.vione_users u
    LEFT JOIN public.members m ON m.user_id = u.id OR m.id = u.id::text
    WHERE u.id = $1::uuid
  `, user.id);
  console.log('Verification result:', verified[0]);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
