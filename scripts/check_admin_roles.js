const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.$queryRawUnsafe(`
    SELECT id, email, username, role FROM public.vione_users 
    WHERE email ILIKE '%admin%' OR role ILIKE '%admin%' OR username ILIKE '%admin%'
  `).catch(e => e.message);
  console.log('vione_users admins:', users);

  const userRoles = await prisma.$queryRawUnsafe(`SELECT * FROM public.user_roles LIMIT 10`).catch(e => e.message);
  console.log('user_roles:', userRoles);

  const memberships = await prisma.$queryRawUnsafe(`SELECT * FROM public.memberships WHERE role ILIKE '%admin%' OR role ILIKE '%owner%'`).catch(e => e.message);
  console.log('memberships admins:', memberships);
}

main().finally(() => prisma.$disconnect());
