const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  // Test news insert
  const newsRes = await prisma.$queryRawUnsafe(`
    INSERT INTO public.news (code, title, category, author, published_at, views, status, excerpt)
    VALUES ('TEST-NEWS-1', 'Test News', 'general', 'Admin', '2026-09-12', 0, 'published', 'Test excerpt')
    RETURNING id, code;
  `);
  console.log("News insert success:", newsRes);

  // Clean up test news
  await prisma.$queryRawUnsafe(`DELETE FROM public.news WHERE code = 'TEST-NEWS-1';`);

  // Test perks insert
  const perkRes = await prisma.$queryRawUnsafe(`
    INSERT INTO public.perks (title, category, partner, summary, description, discount, status)
    VALUES ('Test Perk', 'dining', 'Partner', 'Summary', 'Desc', '10%', 'active')
    RETURNING id, title;
  `);
  console.log("Perk insert success:", perkRes);

  // Clean up test perk
  await prisma.$queryRawUnsafe(`DELETE FROM public.perks WHERE title = 'Test Perk';`);

  // Test notification insert
  const notifRes = await prisma.$queryRawUnsafe(`
    INSERT INTO public.notifications (code, title, message, target_audience, channel, status)
    VALUES ('TEST-NOTIF-1', 'Test Notif', 'Test Msg', 'all', 'in_app', 'scheduled')
    RETURNING id, code;
  `);
  console.log("Notif insert success:", notifRes);

  // Clean up test notif
  await prisma.$queryRawUnsafe(`DELETE FROM public.notifications WHERE code = 'TEST-NOTIF-1';`);

  // Test transaction insert
  const txRes = await prisma.$queryRawUnsafe(`
    INSERT INTO public.transactions (code, date, type, category, description, amount, method, status)
    VALUES ('TEST-TX-1', '2026-09-12', 'income', 'test', 'Test income', 1000, 'cash', 'completed')
    RETURNING id, code;
  `);
  console.log("Tx insert success:", txRes);

  // Clean up test tx
  await prisma.$queryRawUnsafe(`DELETE FROM public.transactions WHERE code = 'TEST-TX-1';`);

  console.log("ALL INSERTS SUCCEEDED PERFECTLY!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
