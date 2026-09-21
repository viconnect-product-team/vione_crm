const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const authUsers = await prisma.$queryRawUnsafe(`
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 5
  `).catch(e => e.message);
  console.log('authUsers latest 5:', authUsers);

  const vioneUsers = await prisma.$queryRawUnsafe(`
    SELECT id, email, username, name 
    FROM public.vione_users 
    ORDER BY created_at DESC 
    LIMIT 5
  `).catch(e => e.message);
  console.log('vioneUsers latest 5:', vioneUsers);
}

main().finally(() => prisma.$disconnect());
