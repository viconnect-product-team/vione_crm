const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding cover_url column to members and vione_users...');
  const statements = [
    "ALTER TABLE public.members ADD COLUMN IF NOT EXISTS cover_url text;",
    "ALTER TABLE public.vione_users ADD COLUMN IF NOT EXISTS cover_url text;"
  ];

  for (const sql of statements) {
    console.log('Executing:', sql);
    await prisma.$executeRawUnsafe(sql);
  }

  console.log('Columns added successfully!');
  const cols = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND column_name = 'cover_url';
  `);
  console.table(cols);
}

main()
  .catch(err => {
    console.error('Error adding cover_url columns:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
