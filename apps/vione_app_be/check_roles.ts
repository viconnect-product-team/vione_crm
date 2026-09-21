import { PrismaClient } from '@vibe/db';

const prisma = new PrismaClient();

async function main() {
  console.log('--- USER ROLES IN DB ---');
  try {
    const roles = await prisma.user_roles.findMany();
    console.log(JSON.stringify(roles, null, 2));
  } catch (err: any) {
    console.error('Error fetching user_roles:', err.message);
  }

  console.log('\n--- VIONE USERS IN DB ---');
  try {
    const users = await prisma.vione_users.findMany({
      select: { id: true, username: true, email: true, name: true, created_at: true },
    });
    console.log(JSON.stringify(users, null, 2));
  } catch (err: any) {
    console.error('Error fetching vione_users:', err.message);
  }

  console.log('\n--- PUBLIC MEMBERS IN DB ---');
  try {
    const members = await prisma.$queryRaw`
      SELECT id, code, name, contact, department, executive_role, user_id FROM public.members WHERE user_id = '00000000-0000-4000-8000-000000000002'::uuid
    `;
    console.log(JSON.stringify(members, null, 2));
  } catch (err: any) {
    console.error('Error fetching members:', err.message);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
