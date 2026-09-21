const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  const regCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='event_registrations'
    ORDER BY ordinal_position;
  `);
  console.log("Columns of event_registrations:", regCols);

  const sampleRegs = await prisma.$queryRawUnsafe(`
    SELECT * FROM public.event_registrations LIMIT 5;
  `);
  console.log("Sample registrations:", sampleRegs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
