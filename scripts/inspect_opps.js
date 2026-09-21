const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'opportunities'
  `);
  console.table(cols);

  const fks = await prisma.$queryRawUnsafe(`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='opportunities'
  `);
  console.log('FKs:', fks);

  // Check admin users in auth.users or vione_users
  const admins = await prisma.$queryRawUnsafe(`
    SELECT id, email, username FROM public.vione_users WHERE email ILIKE '%admin%' OR username ILIKE '%admin%' LIMIT 10
  `).catch(() => []);
  console.log('Admin users in vione_users:', admins);
}

main().finally(() => prisma.$disconnect());
