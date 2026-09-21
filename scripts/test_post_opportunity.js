const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminId = '00000000-0000-4000-8000-000000000001';
  const oppId = `OPP-TEST-${Date.now().toString(36).toUpperCase()}`;
  const assocId = 'c1983000-0000-4000-8000-000000001983';

  console.log(`Attempting to insert test opportunity ${oppId} for admin ${adminId}...`);
  await prisma.$executeRaw`
    INSERT INTO public.opportunities (
      id, association_id, poster_id, title, description, type,
      budget_min, budget_max, region, industry, deadline, status, views, emoji,
      image, contact_name, contact_phone, contact_title, company, created_at, updated_at
    ) VALUES (
      ${oppId}, ${assocId}::uuid, ${adminId}, 'Cơ hội hợp tác đầu tư công nghệ 2026',
      'Tìm kiếm đối tác công nghệ chiến lược triển khai hệ thống chuyển đổi số toàn diện', 'Hợp tác B2B',
      ${BigInt(100000000)}, ${BigInt(500000000)},
      'Toàn quốc', 'Công nghệ & Phần mềm',
      ${new Date(Date.now() + 30 * 86400000)},
      'open', 0, '💡',
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d', 'Trần Tuấn Anh', '0901234567', 'Ban Quản Trị', 'ViConnect Holdings',
      now(), now()
    )
  `;
  console.log('Successfully inserted test opportunity!');

  const inserted = await prisma.$queryRawUnsafe(`
    SELECT * FROM public.opportunities WHERE id = '${oppId}'
  `);
  console.log('Inserted record:', inserted);

  // Clean up test record
  await prisma.$executeRawUnsafe(`DELETE FROM public.opportunities WHERE id = '${oppId}'`);
  console.log('Cleaned up test record.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
