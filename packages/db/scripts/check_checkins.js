const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  const checkinCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='member_checkins'
    ORDER BY ordinal_position;
  `);
  console.log("Columns of member_checkins:", checkinCols);

  const checkins = await prisma.$queryRawUnsafe(`SELECT * FROM public.member_checkins LIMIT 5;`);
  console.log("Existing member_checkins rows:", checkins);
}

main().catch(console.error).finally(() => prisma.$disconnect());
