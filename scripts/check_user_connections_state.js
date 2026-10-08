const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const connCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'connections';
  `);
  console.log('connections columns:', connCols);

  const connData = await prisma.$queryRawUnsafe('SELECT * FROM public.connections LIMIT 5');
  console.log('connections sample:', connData);

  const userConnData = await prisma.$queryRawUnsafe('SELECT * FROM public.user_connections LIMIT 5');
  console.log('user_connections sample:', userConnData);
}

main().finally(() => prisma.$disconnect());
