const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND column_name LIKE '%cover%'
    ORDER BY table_name;
  `);
  console.table(cols);
}

main().finally(() => prisma.$disconnect());
