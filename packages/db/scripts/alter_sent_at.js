const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE public.notifications ALTER COLUMN sent_at DROP DEFAULT;`);
  console.log("Dropped default on sent_at");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.notifications 
    ALTER COLUMN sent_at TYPE timestamp with time zone 
    USING (CASE WHEN sent_at IS NULL OR sent_at = '' THEN NULL ELSE sent_at::timestamp with time zone END);
  `);
  console.log("Altered sent_at to timestamptz");

  await prisma.$executeRawUnsafe(`ALTER TABLE public.notifications ALTER COLUMN sent_at DROP NOT NULL;`);
  console.log("Ensure sent_at DROP NOT NULL");
}

main().catch(console.error).finally(() => prisma.$disconnect());
