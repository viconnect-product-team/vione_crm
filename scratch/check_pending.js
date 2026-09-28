const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  try {
    const assocs = await p.$queryRaw`SELECT id, slug, name FROM public.associations`;
    console.log('ASSOCS:', assocs);
    const pendingMembers = await p.$queryRaw`SELECT id, code, name, contact, email, phone, status, association_id, created_at FROM public.members WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5`;
    console.log('PENDING MEMBERS:', pendingMembers);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await p.$disconnect();
  }
}
run();
