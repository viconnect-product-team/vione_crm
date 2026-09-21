const { Client } = require('pg');
const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  // 1. Standardize uppercase code M1983-007 for Le Hoang Long
  await client.query(`
    UPDATE public.members
    SET code = 'M1983-007',
        name = 'Công ty CP Công nghệ & Giải pháp Long Tech',
        contact = 'Lê Hoàng Long',
        status = 'active'
    WHERE id = 'c1983000-0000-4000-8000-000000000001'
       OR email = 'ceo.tongthuky@ceo1983.com';
  `);

  // 2. Remove any old 007 slugs
  await client.query(`
    DELETE FROM public.member_business_cards 
    WHERE slug ILIKE '%007%' OR slug = 'card-ceo-tongthuky';
  `);

  // 3. Insert M1983-007
  await client.query(`
    INSERT INTO public.member_business_cards (
      id, member_id, owner_user_id, slug, display_name, professional_title, company_name, work_email, work_phone, status, public_mode, created_at, updated_at
    ) VALUES (
      '8465d271-9c28-4343-8f4e-98dc94473cae',
      'c1983000-0000-4000-8000-000000000001',
      'c1983000-0000-4000-8000-000000000001',
      'M1983-007',
      'Lê Hoàng Long',
      'Tổng Thư Ký CLB Doanh Nhân CEO 1983',
      'Công ty CP Công nghệ & Giải pháp Long Tech',
      'ceo.tongthuky@ceo1983.com',
      '0983000001',
      'published',
      'public',
      now(),
      now()
    );
  `);

  console.log('✓ Standardized M1983-007 for Le Hoang Long!');
  await client.end();
}

main().catch(console.error);
