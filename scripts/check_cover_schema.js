const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = ['members', 'association_members', 'business_cards', 'vione_users', 'users'];
  for (const t of tables) {
    try {
      const cols = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = '${t}'
        ORDER BY ordinal_position;
      `);
      if (cols.length > 0) {
        console.log(`=== Table ${t} ===`);
        console.table(cols);
      }
    } catch (e) {
      console.log(`Table ${t} error:`, e.message);
    }
  }
}

main().finally(() => prisma.$disconnect());
