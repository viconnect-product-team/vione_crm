const { Client } = require('pg');
const bcrypt = require('bcrypt');

const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connected to PostgreSQL for clean test reset.');

  // 1. Ensure required columns exist
  await client.query(`
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_by_id text;
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_by_name text;
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone;
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_phone text;
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_company text;

    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS app_scope text DEFAULT 'crm';
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_app text DEFAULT 'crm';

    ALTER TABLE public.business_notifications ADD COLUMN IF NOT EXISTS app_scope text DEFAULT 'vione_app';
    ALTER TABLE public.business_notifications ADD COLUMN IF NOT EXISTS target_app text DEFAULT 'vione_app';
  `);

  // 2. Clear dynamic test data (Preserving accounts, members, profiles, roles, passwords)
  const tablesToClear = [
    'public.opportunity_interests',
    'public.opportunities',
    'public.event_registrations',
    'public.member_checkins',
    'public.events',
    'public.transactions',
    'public.invoices',
    'public.meetings',
    'public.votes',
    'public.notifications',
    'public.business_notifications',
    'public.products',
    'public.messages',
    'public.connections',
    'public.community_join_requests',
    'public.community_invitations'
  ];

  for (const table of tablesToClear) {
    try {
      await client.query(`DELETE FROM ${table};`);
      console.log(`✓ Cleared table ${table}`);
    } catch (err) {
      console.warn(`! Warning clearing ${table}:`, err.message);
    }
  }

  // 3. Ensure standard password '123456' for all core test accounts
  const defaultHash = await bcrypt.hash('123456', 10);
  const targetEmails = [
    'admin@connect.vn',
    'ceo.tongthuky@ceo1983.com',
    'ceo.member1@ceo1983.com',
    'ceo.member2@ceo1983.com',
    'ceo.member3@ceo1983.com'
  ];

  for (const email of targetEmails) {
    await client.query(
      `UPDATE public.vione_users SET password = $1 WHERE email = $2;`,
      [defaultHash, email]
    );
  }
  console.log(`✓ Reset password to '123456' for: ${targetEmails.join(', ')}`);

  // 4. Ensure CEO 1983 association exists
  const assocId = 'c1983000-0000-4000-8000-000000001983';
  await client.query(`
    INSERT INTO public.associations (
      id, name, slug, brand_primary, tagline, about, contact_email, landing_published, ssl_status, public_card_enabled
    ) VALUES (
      $1, 'CLB Doanh Nhân CEO 1983', 'ceo1983', '#004b91',
      'Liên Minh Doanh Nhân Quý Hợi 1983',
      'Cộng đồng hơn 200 Chủ tịch & Tổng Giám đốc sinh năm 1983 trực thuộc HanoiBA.',
      'contact@ceo1983.com', true, 'active', true
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      brand_primary = EXCLUDED.brand_primary;
  `, [assocId]);
  console.log('✓ Verified Association CLB CEO 1983');

  // 5. Seed 1 baseline Event with Seating Plan (so events list has initial data)
  const eventId = 'EVT-1983-GALA-2026';
  const seatingPlan = {
    totalTables: 4,
    seatsPerTable: 10,
    tables: [
      { id: 'VIP-01', name: 'Bàn VIP 01 (Ban Thường Vụ)', category: 'VIP', seats: 10, assigned: 0 },
      { id: 'VIP-02', name: 'Bàn VIP 02 (Khách Mời Danh Dự)', category: 'VIP', seats: 10, assigned: 0 },
      { id: 'TB-03', name: 'Bàn 03 (Ban Xúc Tiến)', category: 'STANDARD', seats: 10, assigned: 0 },
      { id: 'TB-04', name: 'Bàn 04 (Ban Truyền Thông)', category: 'STANDARD', seats: 10, assigned: 0 },
    ]
  };

  await client.query(`
    INSERT INTO public.events (
      id, name, date, location, capacity, registered, status, type, fee, seating_plan, created_at, updated_at, association_id
    ) VALUES (
      $1, 'Đại Hội Doanh Nhân CEO 1983 & Gala Kết Nối Giao Thương',
      CURRENT_DATE + INTERVAL '10 days',
      'Trung Tâm Hội Nghị Quốc Gia - Cổng 1 Đại Lộ Thăng Long, Hà Nội',
      300, 0, 'published', 'in_person', 500000, $2, now(), now(), $3
    )
    ON CONFLICT (id) DO NOTHING;
  `, [eventId, JSON.stringify(seatingPlan), assocId]);
  console.log('✓ Seeded baseline event EVT-1983-GALA-2026');

  console.log('\n=============================================================');
  console.log('DATABASE RESET COMPLETED SUCCESSFULLY FOR FULL TEST RUN!');
  console.log('Accounts ready:');
  console.log('- CRM / Platform Admin: admin@connect.vn / 123456');
  console.log('- Hiệp Hội Admin:       ceo.tongthuky@ceo1983.com / 123456');
  console.log('- Hội viên 1:           ceo.member1@ceo1983.com / 123456 (M1983-012)');
  console.log('- Hội viên 2:           ceo.member2@ceo1983.com / 123456 (M1983-013)');
  console.log('- Hội viên 3:           ceo.member3@ceo1983.com / 123456 (M1983-014)');
  console.log('=============================================================\n');

  await client.end();
}

main().catch((err) => {
  console.error('Error during test reset:', err);
  process.exit(1);
});
