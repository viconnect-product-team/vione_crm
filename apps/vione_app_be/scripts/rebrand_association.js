const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Rebranding association c1983000-0000-4000-8000-000000001983...');

  const result = await prisma.$executeRaw`
    UPDATE public.associations
    SET 
      name = 'Cộng Đồng Doanh Nhân ViOne Connect',
      slug = 'vione-connect',
      logo_url = '/vione-wordmark.png',
      tagline = 'Hệ sinh thái kết nối & giao thương doanh nghiệp tinh hoa',
      about = 'Cộng đồng Doanh nhân ViOne Connect quy tụ các nhà sáng lập, CEO và lãnh đạo doanh nghiệp tiên phong ứng dụng công nghệ và trí tuệ nhân tạo.'
    WHERE id = 'c1983000-0000-4000-8000-000000001983'::uuid OR slug = 'ceo1983' OR name LIKE '%1983%';
  `;
  console.log('Updated associations count:', result);

  // Also check if any other association has 1983
  const remaining = await prisma.$queryRaw`
    SELECT id, name, slug, logo_url, tagline FROM public.associations
  `;
  console.log('Current associations:', JSON.stringify(remaining, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
