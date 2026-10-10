const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  const notifCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='notifications'
    ORDER BY ordinal_position;
  `);
  console.log("Columns of notifications:", notifCols);
}

main().catch(console.error).finally(() => prisma.$disconnect());
