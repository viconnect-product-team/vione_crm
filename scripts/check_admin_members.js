const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'members'
  `);
  console.log('members cols:', cols.map(c => c.column_name));

  const adminMembers = await prisma.$queryRawUnsafe(`
    SELECT id, user_id, name, email, association_id, status 
    FROM public.members 
    WHERE email ILIKE '%admin%' OR name ILIKE '%admin%'
  `).catch(e => e.message);
  console.log('adminMembers:', adminMembers);
}

main().finally(() => prisma.$disconnect());
