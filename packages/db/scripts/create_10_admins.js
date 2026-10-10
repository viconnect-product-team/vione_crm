const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();
  console.log('Connected to Database.');

  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(`Bcrypt hash for password "${password}": ${hashedPassword}`);

  // 1. Delete legacy @vione.vn accounts from all tables
  for (let i = 1; i <= 10; i++) {
    const legacyEmail = `admin${i}@vione.vn`;
    const res = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [legacyEmail]);
    if (res.rows.length > 0) {
      const id = res.rows[0].id;
      console.log(`Deleting legacy user ${legacyEmail} (ID: ${id})`);
      await client.query(`DELETE FROM public.business_identities WHERE owner_user_id = $1::uuid`, [id]);
      await client.query(`DELETE FROM public.user_profiles WHERE user_id = $1::uuid`, [id]);
      await client.query(`DELETE FROM public.user_roles WHERE user_id = $1::uuid`, [id]);
      await client.query(`DELETE FROM public.vione_users WHERE id = $1::uuid`, [id]);
      await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [id]);
    }
  }

  // 2. Create/Verify connect.vn admin accounts
  const domains = ['connect.vn'];
  for (const domain of domains) {
    for (let i = 1; i <= 10; i++) {
      const userId = crypto.randomUUID();
      const identityId = crypto.randomUUID();
      const email = `admin${i}@${domain}`;
      const username = email;
      const name = `VIONE Admin ${i}`;

      // Insert into auth.users first (only id, email, role exist in this schema)
      const existingAuth = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
      let actualUserId;
      if (existingAuth.rows.length > 0) {
        actualUserId = existingAuth.rows[0].id;
        console.log(`User ${email} already exists in auth.users (ID: ${actualUserId}).`);
      } else {
        actualUserId = userId;
        await client.query(`
          INSERT INTO auth.users (id, email, role)
          VALUES ($1::uuid, $2, 'authenticated')
        `, [actualUserId, email]);
        console.log(`Inserted user ${email} into auth.users (ID: ${actualUserId}).`);
      }

      // Insert into public.vione_users (where password verification occurs)
      await client.query(`
        INSERT INTO public.vione_users (id, username, password, email, name, email_verified, created_at, updated_at)
        VALUES ($1::uuid, $2, $3, $4, $5, true, now(), now())
        ON CONFLICT (email) DO UPDATE SET
          password = EXCLUDED.password,
          name = EXCLUDED.name,
          updated_at = now()
      `, [actualUserId, username, hashedPassword, email, name]);

      // Insert into public.user_roles (platform_admin)
      await client.query(`
        INSERT INTO public.user_roles (user_id, role, created_at)
        VALUES ($1::uuid, 'platform_admin', now())
        ON CONFLICT (user_id, role) DO NOTHING
      `, [actualUserId]);

      // Insert into public.user_profiles
      await client.query(`
        INSERT INTO public.user_profiles (user_id, display_name, professional_title, company_name, onboarding_status, account_status, created_at, updated_at)
        VALUES ($1::uuid, $2, 'Hệ Thống Admin', 'VIONE Group', 'completed', 'active', now(), now())
        ON CONFLICT (user_id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          updated_at = now()
      `, [actualUserId, name]);

      // Insert into public.business_identities
      await client.query(`
        INSERT INTO public.business_identities (id, owner_user_id, display_name, job_title, company_name, primary_email, status, created_at, updated_at)
        VALUES ($1::uuid, $2::uuid, $3, 'Hệ Thống Admin', 'VIONE Group', $4, 'active', now(), now())
        ON CONFLICT (owner_user_id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          primary_email = EXCLUDED.primary_email,
          updated_at = now()
      `, [identityId, actualUserId, name, email]);

      // Insert into public.memberships (default association admin)
      await client.query(`
        INSERT INTO public.memberships (user_id, association_id, role, is_default, created_at, updated_at)
        VALUES ($1::uuid, '3d668c0e-a309-46c5-a2f5-c7d5b8cb038b'::uuid, 'admin', true, now(), now())
        ON CONFLICT (user_id, association_id) DO UPDATE SET
          role = 'admin',
          is_default = true,
          updated_at = now()
      `, [actualUserId]);

      console.log(`Created/Verified admin account: ${email} | Password: ${password}`);
    }
  }

  await client.end();
}

main().catch(console.error);
