const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.$queryRawUnsafe(`SELECT id, email FROM public.vione_users LIMIT 10;`);
  console.log("Users:", users);

  const members = await prisma.$queryRawUnsafe(`SELECT id, code, name, email, user_id FROM public.members LIMIT 10;`);
  console.log("Members:", members);
}

main().catch(console.error).finally(() => prisma.$disconnect());
