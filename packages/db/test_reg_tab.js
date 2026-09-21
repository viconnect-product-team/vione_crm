const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  const userId = '00000000-0000-4000-8000-000000000002';
  const communityId = 'c1983000-0000-4000-8000-000000001983';
  const userMembers = await prisma.$queryRaw`
    SELECT code, email FROM public.members WHERE user_id = ${userId}::uuid
  `.catch(e => []);
  const userMemberCodes = userMembers.map(m => m.code).filter(Boolean);
  const userEmail = 'admin@connect.vn';

  const events = await prisma.$queryRaw`
    SELECT e.*
    FROM public.events e
    WHERE e.association_id = ${communityId}::uuid
      AND e.id IN (
        SELECT r.event_id FROM public.event_registrations r
        WHERE (r.member_code = ANY(${userMemberCodes}) OR (r.email != '' AND r.email = ${userEmail}))
          AND r.status != 'cancelled'
      )
    ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
    OFFSET 0 LIMIT 10
  `;
  console.log("Registered events SUCCESS:", events.length, events[0]?.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
