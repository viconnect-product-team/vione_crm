const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE public.transactions ALTER COLUMN association_id DROP NOT NULL;`);
  console.log("association_id DROP NOT NULL");

  await prisma.$executeRawUnsafe(`ALTER TABLE public.transactions ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
  console.log("id default set");

  await prisma.$executeRawUnsafe(`ALTER TABLE public.transactions ALTER COLUMN created_at SET DEFAULT now();`);
  console.log("created_at default set");

  await prisma.$executeRawUnsafe(`ALTER TABLE public.transactions ALTER COLUMN updated_at SET DEFAULT now();`);
  console.log("updated_at default set");
}

main().catch(console.error).finally(() => prisma.$disconnect());
