const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.$queryRawUnsafe('SELECT current_association_id()');
    console.log('current_association_id result:', res);
  } catch (err) {
    console.error('Error calling current_association_id():', err.message);
  }
}

main().finally(() => prisma.$disconnect());
