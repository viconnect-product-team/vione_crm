const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'events'
  `);
  console.log('Events columns:', cols);

  const sample = await prisma.$queryRawUnsafe(`
    SELECT *
    FROM public.events
    LIMIT 5
  `);
  console.log('Sample events:', sample);
}

main().catch(console.error).finally(() => prisma.$disconnect());
