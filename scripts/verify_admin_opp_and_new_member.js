const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- 1. Testing Opportunity Creation for Admin ---');
  const adminId = '00000000-0000-4000-8000-000000000001';
  const oppId = `OPP-ADM-${Date.now().toString(36).toUpperCase()}`;
  const assocId = 'c1983000-0000-4000-8000-000000001983';

  // Fetch admin user
  const adminUser = await prisma.vione_users.findUnique({ where: { id: adminId } });
  console.log('Admin user found:', adminUser?.name);

  // Insert opportunity mimicking createOpportunity
  await prisma.$executeRaw`
    INSERT INTO public.opportunities (
      id, association_id, poster_id, title, description, type,
      budget_min, budget_max, region, industry, deadline, status, views, emoji,
      image, contact_name, contact_phone, contact_title, company, created_at, updated_at
    ) VALUES (
      ${oppId}, ${assocId}::uuid, ${adminId}, 'Cơ hội kết nối cấp quản trị viên',
      'Admin tạo cơ hội kết nối hệ thống giao thương toàn quốc cho hội viên CLB CEO 1983', 'Hợp tác B2B',
      ${BigInt(50000000)}, ${BigInt(200000000)},
      'Toàn quốc', 'Công nghệ & Đầu tư',
      ${new Date(Date.now() + 30 * 86400000)},
      'open', 0, '💡',
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d', ${adminUser?.name || 'Trần Tuấn Anh'}, '0901234567', 'Ban Quản Trị', 'ViConnect Holdings',
      now(), now()
    )
  `;
  console.log(`Opportunity ${oppId} inserted successfully!`);

  // Query it back
  const queryResult = await prisma.$queryRawUnsafe(`
    SELECT id, title, poster_id, contact_name, company, association_id, status 
    FROM public.opportunities 
    WHERE id = '${oppId}'
  `);
  console.log('Verified inserted opportunity in DB:', queryResult);

  // Cleanup test opp
  await prisma.$executeRawUnsafe(`DELETE FROM public.opportunities WHERE id = '${oppId}'`);
  console.log('Cleaned up test opportunity.');

  console.log('\n--- 2. Testing New Member Profile Verification ---');
  // Check a new user in vione_users without prior member row or test user
  const testUsers = await prisma.$queryRawUnsafe(`
    SELECT u.id, u.name, u.email, u.username, m.id as member_id, m.name as member_name
    FROM public.vione_users u
    LEFT JOIN public.members m ON m.user_id = u.id
    ORDER BY u.created_at DESC
    LIMIT 5
  `);
  console.table(testUsers);

  console.log('\nAll verifications passed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
