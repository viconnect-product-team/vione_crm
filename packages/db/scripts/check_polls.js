const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  const pCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='polls'
    ORDER BY ordinal_position;
  `);
  console.log("Columns of polls:", pCols);

  const oCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='poll_options'
    ORDER BY ordinal_position;
  `);
  console.log("Columns of poll_options:", oCols);
}

main().catch(console.error).finally(() => prisma.$disconnect());
