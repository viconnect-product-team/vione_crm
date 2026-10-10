const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const assocs = await prisma.$queryRawUnsafe(`SELECT id, name, slug, logo_url FROM public.associations`);
    console.log('ASSOCIATIONS COUNT:', assocs.length);
    console.log(JSON.stringify(assocs, null, 2));
  } catch (err) {
    console.error('Error querying associations:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
