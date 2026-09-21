const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const ceoAssocId = 'c1983000-0000-4000-8000-000000001983';

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();
  console.log('Connected to PostgreSQL.');

  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const accounts = [
    { email: 'admin@ceo1983.vn', name: 'Nguyễn Văn Hùng (Chủ tịch CEO 1983)', role: 'admin', title: 'Chủ tịch CLB CEO 1983', company: 'Hùng Phát Corp' },
    { email: 'ceo1983@vione.app', name: 'Ban Quản Trị CEO 1983', role: 'admin', title: 'Ban Thư Ký', company: 'CLB Doanh Nhân CEO 1983' },
    { email: 'admin@hanoiba.org.vn', name: 'Trần Đăng Khoa (Chủ tịch HanoiBA)', role: 'admin', title: 'Chủ tịch Hội', company: 'Khoa Vàng Tech Group', assocId: 'ba000000-0000-4000-8000-000000000001' }
  ];

  for (const acc of accounts) {
    const targetAssoc = acc.assocId || ceoAssocId;
    let userId;

    const existingAuth = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [acc.email]);
    if (existingAuth.rows.length > 0) {
      userId = existingAuth.rows[0].id;
      console.log(`User ${acc.email} exists with ID: ${userId}`);
    } else {
      userId = crypto.randomUUID();
      console.log(`Creating auth user ${acc.email} with ID: ${userId}...`);
      await client.query(`
        INSERT INTO auth.users (id, email, role)
        VALUES ($1::uuid, $2, 'authenticated')
      `, [userId, acc.email]);
    }

    // Insert into public.vione_users
    await client.query(`
      INSERT INTO public.vione_users (id, username, password, email, name, email_verified, created_at, updated_at)
      VALUES ($1::uuid, $2, $3, $4, $5, true, now(), now())
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        name = EXCLUDED.name,
        updated_at = now()
    `, [userId, acc.email, hashedPassword, acc.email, acc.name]);

    // Insert into public.user_roles
    await client.query(`
      INSERT INTO public.user_roles (user_id, role, created_at)
      VALUES ($1::uuid, 'platform_admin', now())
      ON CONFLICT (user_id, role) DO NOTHING
    `, [userId]);

    // Insert into public.user_profiles
    await client.query(`
      INSERT INTO public.user_profiles (user_id, display_name, professional_title, company_name, onboarding_status, account_status, created_at, updated_at)
      VALUES ($1::uuid, $2, $3, $4, 'completed', 'active', now(), now())
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        professional_title = EXCLUDED.professional_title,
        company_name = EXCLUDED.company_name,
        updated_at = now()
    `, [userId, acc.name, acc.title, acc.company]);

    // Insert into public.business_identities
    const identityId = crypto.randomUUID();
    await client.query(`
      INSERT INTO public.business_identities (id, owner_user_id, display_name, job_title, company_name, primary_email, status, created_at, updated_at)
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, 'active', now(), now())
      ON CONFLICT (owner_user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        job_title = EXCLUDED.job_title,
        company_name = EXCLUDED.company_name,
        primary_email = EXCLUDED.primary_email,
        updated_at = now()
    `, [identityId, userId, acc.name, acc.title, acc.company, acc.email]);

    // Ensure memberships for association
    await client.query(`
      INSERT INTO public.memberships (id, user_id, association_id, role, is_default, created_at, updated_at)
      VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'admin', true, now(), now())
      ON CONFLICT DO NOTHING
    `, [userId, targetAssoc]);

    console.log(`Configured account ${acc.email} -> password: ${password}`);
  }

  console.log('✅ ALL DEDICATED ACCOUNTS CREATED PERFECTLY!');
  await client.end();
}

main().catch(console.error);
