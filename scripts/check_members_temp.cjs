const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true"
    }
  }
});

async function main() {
  const users = await prisma.$queryRawUnsafe(`
    SELECT u.id, u.email, u.name, m.code, m.name as member_name, m.email as member_email 
    FROM public.vione_users u 
    LEFT JOIN public.members m ON m.user_id = u.id 
    ORDER BY u.created_at DESC
  `);
  console.log('USERS & MEMBERS:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
