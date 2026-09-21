const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  const tables = ['news', 'perks', 'notifications', 'transactions'];
  for (const t of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE public.${t} ALTER COLUMN association_id DROP NOT NULL;`);
      console.log(`public.${t}: association_id DROP NOT NULL`);
    } catch (e) {
      console.log(`public.${t}: association_id error`, e.message);
    }

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE public.${t} ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
      console.log(`public.${t}: id DEFAULT gen_random_uuid()`);
    } catch (e) {
      console.log(`public.${t}: id error`, e.message);
    }

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE public.${t} ALTER COLUMN created_at SET DEFAULT now();`);
      console.log(`public.${t}: created_at DEFAULT now()`);
    } catch (e) {
      console.log(`public.${t}: created_at error`, e.message);
    }

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE public.${t} ALTER COLUMN updated_at SET DEFAULT now();`);
      console.log(`public.${t}: updated_at DEFAULT now()`);
    } catch (e) {
      console.log(`public.${t}: updated_at error`, e.message);
    }
  }

  // Also check perks sort_order nullable or default 0
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE public.perks ALTER COLUMN sort_order SET DEFAULT 0;`);
    console.log(`public.perks: sort_order DEFAULT 0`);
  } catch (e) {
    console.log(`public.perks: sort_order error`, e.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
