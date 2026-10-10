const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  const newsCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='news'
    ORDER BY ordinal_position;
  `);
  console.log("Columns of news:", newsCols);

  const perksCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='perks'
    ORDER BY ordinal_position;
  `);
  console.log("Columns of perks:", perksCols);
}

main().catch(console.error).finally(() => prisma.$disconnect());
