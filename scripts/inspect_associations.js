const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const a = await prisma.$queryRawUnsafe('SELECT id, name, slug FROM public.associations');
  console.log('Associations:', a);
}

main().finally(() => prisma.$disconnect());
