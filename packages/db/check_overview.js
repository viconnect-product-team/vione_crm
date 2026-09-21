const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  const regRows = await prisma.$queryRaw`
    SELECT event_id, status FROM public.event_registrations
  `;
  const checkinRows = await prisma.$queryRaw`
    SELECT event_id FROM public.member_checkins WHERE status = 'success'
    UNION ALL
    SELECT event_id FROM public.event_registrations WHERE checked_in_at IS NOT NULL
  `;
  console.log("Registrations count:", regRows.length);
  console.log("Checkins count:", checkinRows.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
