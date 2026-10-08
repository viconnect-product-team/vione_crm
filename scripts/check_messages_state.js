const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const m = await prisma.$queryRawUnsafe(`
    SELECT * FROM public.business_relationship_moments LIMIT 1
  `);
  console.log('moment cols:', m);
}
run().finally(() => prisma.$disconnect());
