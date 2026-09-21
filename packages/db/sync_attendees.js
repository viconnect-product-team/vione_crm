const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.$executeRawUnsafe(`
    UPDATE public.event_registrations
    SET checked_in_at = now()
    WHERE id IN ('REG-1983-001', 'REG-1983-002', 'REG-1983-004', 'REG-1983-005');
  `);
  console.log("Updated registrations checked_in_at:", res);

  // Also insert into member_checkins for those members
  await prisma.$executeRawUnsafe(`
    INSERT INTO public.member_checkins (id, client_id, member_code, event_id, event_title, status, method, checked_at, created_at, association_id)
    VALUES 
      (gen_random_uuid(), 'CLIENT-001', 'M1983-001', 'EVT-1983-GALA-2026', 'Gala Giao Thương & Xúc Tiến Đầu Tư CEO 1983', 'success', 'qr', now(), now(), 'c1983000-0000-4000-8000-000000001983'),
      (gen_random_uuid(), 'CLIENT-002', 'M1983-002', 'EVT-1983-GALA-2026', 'Gala Giao Thương & Xúc Tiến Đầu Tư CEO 1983', 'success', 'qr', now(), now(), 'c1983000-0000-4000-8000-000000001983')
    ON CONFLICT (client_id) DO NOTHING;
  `);
  console.log("Synced member_checkins rows");
}

main().catch(console.error).finally(() => prisma.$disconnect());
