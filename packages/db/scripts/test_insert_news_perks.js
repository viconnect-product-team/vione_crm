const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing insert into news...');
    const newsRes = await prisma.$executeRaw`
      INSERT INTO public.news (code, title, category, author, published_at, status, excerpt, views)
      VALUES ('NEWS-TEST', 'Tin tức thử nghiệm', 'Sự kiện', 'Ban Thư Ký', '2026-09-12', 'published', 'Mô tả ngắn', 0)
    `.catch(e => console.error('News insert error:', e));
    console.log('News insert result:', newsRes);

    console.log('Testing insert into perks...');
    const perkRes = await prisma.$executeRaw`
      INSERT INTO public.perks (title, category, partner, summary, description, discount, icon, link, status, sort_order)
      VALUES ('Tiện ích thử nghiệm', 'Dịch vụ', 'Đối tác A', 'Ưu đãi', 'Chi tiết', '10%', 'Gift', 'https://example.com', 'active', 1)
    `.catch(e => console.error('Perks insert error:', e));
    console.log('Perks insert result:', perkRes);
  } finally {
    await prisma.$disconnect();
  }
}

main();
