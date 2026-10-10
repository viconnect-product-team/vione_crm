const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const newsCols = await prisma.$queryRawUnsafe("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'news' ORDER BY ordinal_position;");
    console.log('NEWS COLS:', newsCols);

    const perksCols = await prisma.$queryRawUnsafe("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'perks' ORDER BY ordinal_position;");
    console.log('PERKS COLS:', perksCols);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
