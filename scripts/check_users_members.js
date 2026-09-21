const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mems = await prisma.$queryRawUnsafe(`
    SELECT id, user_id, name, email, phone, association_id 
    FROM public.members 
    WHERE email IN ('ceo.namhai@vione.app', 'annam@connect.vn', 'thuylt313@gmail.com')
       OR user_id IN ('4cae6fd6-effc-4c5c-beb4-80967f2cfa07', 'aac8ff59-a145-4892-bf31-17ff83d5c852', 'a77c1760-db01-491d-ad6a-b07f93a40d80')
  `);
  console.log('mems for those users:', mems);
}

main().finally(() => prisma.$disconnect());
