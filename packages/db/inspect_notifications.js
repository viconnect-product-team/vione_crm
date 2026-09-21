const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const code = `NTF-${Date.now().toString(36).toUpperCase()}`;
    const title = "Thông báo sự kiện gala sắp diễn ra";
    const body = "Thứ 2 sẽ diễn ra sự kiện kính mong Anh/ Chị đăng ký tham gia";
    const audience = "all";
    const channel = "inapp";
    const status = "scheduled";
    const appScope = "vione_app";
    const now = new Date();
    const assocId = null;

    console.log('Dropping NOT NULL on association_id...');
    await prisma.$executeRawUnsafe("ALTER TABLE public.notifications ALTER COLUMN association_id DROP NOT NULL;");
    console.log('Dropped NOT NULL on association_id successfully!');

    console.log('Testing insert again...');
    await prisma.$executeRaw`
      INSERT INTO public.notifications (
        id, code, title, body, audience, channel, status, sent_at, reach, association_id, app_scope, target_app, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${code}, ${title}, ${body}, ${audience}, ${channel},
        ${status}, ${status === 'sent' ? now.toISOString() : null}, 0, ${assocId}::uuid,
        ${appScope}, ${appScope}, ${now}, ${now}
      )
    `;
    console.log('Insert SUCCESS!');
  } catch (err) {
    console.error('Insert ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
