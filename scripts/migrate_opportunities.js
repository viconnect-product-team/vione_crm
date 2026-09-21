const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding missing columns to public.opportunities...');
  const statements = [
    `ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS image text`,
    `ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contact_name text`,
    `ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contact_phone text`,
    `ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contact_title text`,
    `ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS company text`
  ];

  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log('Columns added successfully.');

  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'opportunities'
    ORDER BY ordinal_position
  `);
  console.table(cols);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
