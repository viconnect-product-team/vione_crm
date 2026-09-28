const { Client } = require('pg');
const crypto = require('crypto');

async function testRegistration() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();

  const fullName = "Nguyễn Văn Đăng Ký Test";
  const phone = "0983838383";
  const email = "dangky.test83@gmail.com";
  const company = "Công Ty TNHH Giải Pháp Số 1983";
  const title = "Tổng Giám Đốc";
  const clubSlug = "ceo-1983";

  // 1. Resolve assoc
  const assocs = await client.query(`
    SELECT id FROM public.associations 
    WHERE LOWER(slug) IN ($1, $2, 'ceo-1983', 'ceo1983', 'clb-ceo-1983')
    LIMIT 1
  `, [clubSlug.toLowerCase(), clubSlug.replace(/-/g, '').toLowerCase()]);
  const assocId = assocs.rows[0]?.id;
  console.log('Target Assoc ID:', assocId);

  // 2. Provision user in vione_users and auth.users
  const userId = crypto.randomUUID();
  await client.query(`
    INSERT INTO public.vione_users (id, username, email, name, password, email_verified, created_at, updated_at)
    VALUES ($1::uuid, $2, $3, $4, 'hashed_pass_placeholder', true, now(), now())
    ON CONFLICT (id) DO UPDATE SET email = $3, name = $4, updated_at = now()
  `, [userId, email.toLowerCase(), email.toLowerCase(), fullName]);

  await client.query(`
    INSERT INTO auth.users (id, email, role)
    VALUES ($1::uuid, $2, 'authenticated')
    ON CONFLICT (id) DO UPDATE SET email = $2
  `, [userId, email.toLowerCase()]);

  // 3. Insert into public.members
  const memberId = `MB${Date.now().toString(36).toUpperCase()}`;
  const now = new Date();
  const joinedAt = now.toISOString().slice(0, 10);
  const feeYear = now.getFullYear();

  const insertRes = await client.query(`
    INSERT INTO public.members (
      id, code, name, contact, email, phone, type, level, industry, region, status, joined_at, fee_year, fee_paid, about, user_id, association_id, created_at, updated_at
    ) VALUES (
      $1, '', $2, $3, $4, $5, 'company', 'memberLevel.medium', 'ind.it', 'region.north', 'pending',
      $6::date, $7, false, 'Đăng ký trực tuyến từ Landing CEO 1983', $8::uuid, $9::uuid, now(), now()
    ) RETURNING id, name, contact, email, phone, status, association_id
  `, [memberId, company, fullName, email, phone, joinedAt, feeYear, userId, assocId]);

  console.log('MEMBER INSERT SUCCESS:', insertRes.rows[0]);

  // Verify list in CRM
  const crmRows = await client.query(`
    SELECT id, code, name, contact, email, phone, status, association_id, created_at
    FROM public.members
    WHERE association_id = $1::uuid
    ORDER BY created_at DESC
    LIMIT 3
  `, [assocId]);
  console.log('LATEST MEMBERS FOR CRM:', crmRows.rows);

  await client.end();
}

testRegistration().catch(console.error);
