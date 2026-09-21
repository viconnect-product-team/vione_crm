const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles'
  `).catch(e => e.message);
  console.log('user_profiles cols:', cols);
}

main().finally(() => prisma.$disconnect());
