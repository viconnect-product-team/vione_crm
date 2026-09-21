const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding missing columns to public.products...');
  const statements = [
    "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name text;",
    "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company text;",
    "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price bigint;",
    "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS member_price bigint;",
    "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'Gói';",
    "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency text DEFAULT 'VND';",
    "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;"
  ];

  for (const sql of statements) {
    console.log('Executing:', sql);
    await prisma.$executeRawUnsafe(sql);
  }

  console.log('Columns added successfully!');
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products'
    ORDER BY ordinal_position;
  `);
  console.table(cols);
}

main()
  .catch(err => {
    console.error('Error adding columns:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
