const { Client } = require('pg');

const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connected to PostgreSQL database.');

  // 1. Schema guard: Ensure necessary columns exist
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

  // 2. Clear activity/test data — PRESERVING ALL USER ACCOUNTS & PROFILES
  console.log('Clearing old activity data (Keeping accounts, members, profiles, passwords)...');

  await client.query('DROP TRIGGER IF EXISTS bmfu_block_delete_trg ON public.business_meeting_follow_ups;');

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
    'public.news',
    'public.business_notifications',
    'public.notifications',
    'public.business_meeting_calendar_projections',
    'public.business_meeting_time_proposals',
    'public.business_meeting_proposals',
    'public.business_meeting_participants',
    'public.business_meeting_follow_ups',
    'public.business_meetings',
    'public.business_relationship_moment_comments',
    'public.business_relationship_moment_comment_likes',
    'public.business_relationship_moment_likes',
    'public.community_opportunity_followup_events',
    'public.community_opportunity_followups',
    'public.community_join_requests',
    'public.community_invitations',
  ];

  for (const t of tablesToClear) {
    try {
      await client.query(`DELETE FROM ${t};`);
      console.log(`✓ Cleared table ${t}`);
    } catch (e) {
      console.warn(`! Table ${t} clear warning:`, e.message);
    }
  }

  // Restore trigger if function exists
  await client.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'bmfu_block_delete') THEN
        CREATE TRIGGER bmfu_block_delete_trg
        BEFORE DELETE ON public.business_meeting_follow_ups
        FOR EACH ROW EXECUTE FUNCTION bmfu_block_delete();
      END IF;
    END $$;
  `);

  const assocId = 'c1983000-0000-4000-8000-000000001983';

  // 3. Ensure Association CEO 1983 exists
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

  // 4. Seed 2 Realistic Opportunities:
  // - OPP-1983-001: Partnership (Already claimed by James Nguyễn as historical reference)
  // - OPP-1983-002: Supply opportunity (Open & Unclaimed, ready for user admin@connect.vn to test claim & interest!)
  console.log('Seeding fresh opportunities for CEO 1983...');

  const opp1Id = 'OPP-1983-001';
  await client.query(`
    INSERT INTO public.opportunities (
      id, poster_id, title, description, type, budget_min, budget_max, region, industry, deadline,
      status, views, emoji, association_id, created_at, updated_at,
      claimed_by_id, claimed_by_name, claimed_at, claimed_phone, claimed_company
    ) VALUES (
      $1, 'c1983000-0000-4000-8000-000000000001',
      'Cần tìm nhà thầu cung cấp giải pháp chuyển đổi số & CRM ERP cho chuỗi 20 showroom',
      'Yêu cầu đơn vị có năng lực triển khai hệ thống quản trị dữ liệu khách hàng, tích hợp Zalo Mini App và đồng bộ kho hàng theo thời gian thực.',
      'partnership', 500000000, 1200000000, 'Toàn quốc', 'Công nghệ & Viễn thông',
      now() + INTERVAL '30 days', 'open', 156, '💼', $2, now(), now(),
      '00000000-0000-4000-8000-000000000003', 'James Nguyễn', now() - INTERVAL '2 hours', '0901000003', 'Uranus Tech'
    );
  `, [opp1Id, assocId]);

  await client.query(`
    INSERT INTO public.opportunity_interests (
      id, opportunity_id, member_id, message, contact, interest_level, created_at, association_id
    ) VALUES (
      'INT-001', $1, '00000000-0000-4000-8000-000000000003',
      'Uranus Tech đã nhận kết nối và hoàn thành báo giá kỹ thuật.',
      '0901000003', 'high', now(), $2
    );
  `, [opp1Id, assocId]);

  const opp2Id = 'OPP-1983-002';
  await client.query(`
    INSERT INTO public.opportunities (
      id, poster_id, title, description, type, budget_min, budget_max, region, industry, deadline,
      status, views, emoji, association_id, created_at, updated_at
    ) VALUES (
      $1, 'c1983000-0000-4000-8000-000000000005',
      'Cung cấp nguyên liệu bao bì sinh học tự hủy xuất khẩu EU số lượng lớn',
      'Năng lực cung ứng 50 tấn/tháng đạt chứng nhận TUV Rheinland và chuẩn xuất khẩu thị trường Châu Âu.',
      'supply', 2000000000, 5000000000, 'Miền Bắc', 'Sản xuất & Xuất nhập khẩu',
      now() + INTERVAL '45 days', 'open', 89, '📦', $2, now(), now()
    );
  `, [opp2Id, assocId]);

  console.log('✓ Seeded OPP-1983-001 & OPP-1983-002');

  // 5. Seed official event with seating plan
  const eventId = 'EVT-1983-GALA-2026';
  const seatingPlan = {
    totalTables: 8,
    seatsPerTable: 10,
    tables: [
      { id: 'VIP-01', name: 'Bàn VIP 01 (Ban Thường Vụ)', category: 'VIP', seats: 10, assigned: 6 },
      { id: 'VIP-02', name: 'Bàn VIP 02 (Khách Mời Danh Dự)', category: 'VIP', seats: 10, assigned: 4 },
      { id: 'TB-03', name: 'Bàn 03 (Ban Xúc Tiến Giao Thương)', category: 'STANDARD', seats: 10, assigned: 5 },
      { id: 'TB-04', name: 'Bàn 04 (Ban Truyền Thông & Sự Kiện)', category: 'STANDARD', seats: 10, assigned: 3 },
    ]
  };

  await client.query(`
    INSERT INTO public.events (
      id, name, date, location, capacity, registered, status, type, fee, seating_plan, created_at, updated_at, association_id
    ) VALUES (
      $1, 'Gala Giao Thương & Xúc Tiến Đầu Tư CEO 1983 - Kỷ Nguyên 5000 Tỷ',
      CURRENT_DATE + INTERVAL '15 days',
      'Trung Tâm Hội Nghị Quốc Gia (NCC) - Cổng số 1 Đại Lộ Thăng Long, Hà Nội',
      200, 10, 'published', 'in_person', 500000, $2, now(), now(), $3
    );
  `, [eventId, JSON.stringify(seatingPlan), assocId]);
  console.log('✓ Seeded Gala Event EVT-1983-GALA-2026');

  // 6. Seed official News
  await client.query(`
    INSERT INTO public.news (
      id, code, title, category, author, published_at, views, status, excerpt, content, cover_image, association_id, created_at, updated_at
    ) VALUES (
      'c1983000-0000-4000-8000-000000000091', 'N198301',
      'Hội nghị Xúc tiến Thương mại & Kết nối Đầu tư Quốc tế Quý 3/2026',
      'Thông báo Ban Chấp Hành', 'Ban Thư Ký', now(), 342, 'published',
      'Chương trình kết nối giao thương giữa các hội viên CLB CEO 1983 và các hiệp hội doanh nghiệp quốc tế.',
      'Toàn bộ kế hoạch tổ chức, danh sách đối tác và lịch trình chi tiết...',
      '/ceo1983_hero_cosmos_skyline.jpg', $1, now(), now()
    );
  `, [assocId]);
  console.log('✓ Seeded News article NEWS-1983-001');

  // 7. Seed initial welcome notifications in public.business_notifications & public.notifications
  const adminUserId = '00000000-0000-4000-8000-000000000002'; // admin@connect.vn
  await client.query(`
    INSERT INTO public.business_notifications (
      id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
      title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1, 'system', 'sys-001', 'init_welcome_admin', 'welcome', 'system_broadcast',
      'Chào mừng bạn đến với ViOne Platform',
      'Hệ thống kết nối giao thương B2B và CRM điều hành đã sẵn sàng.',
      '{}'::jsonb, 'high', 'delivered', 'all', 'all', now(), now()
    );
  `, [adminUserId]);

  await client.query(`
    INSERT INTO public.notifications (
      id, code, title, body, audience, channel, status, sent_at, reach, association_id, app_scope, target_app, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), 'NOTIF-INIT-001',
      'Hệ thống CRM ViOne đã khởi động',
      'Dữ liệu đồng bộ 3 chiều: Web CRM <-> Hiệp hội <-> ViOne Mobile đang hoạt động ổn định.',
      'all', 'inapp', 'sent', now(), 1, $1, 'all', 'all', now(), now()
    );
  `, [assocId]);
  console.log('✓ Seeded Initial Notifications');

  console.log('\n======================================================');
  console.log('SUCCESS: All test data has been reset while keeping all user accounts!');
  console.log('Accounts preserved: admin@connect.vn, admin1@connect.vn, ceo.*@ceo1983.com, etc.');
  console.log('======================================================');

  await client.end();
}

main().catch((err) => {
  console.error('Fatal error during reset:', err);
  process.exit(1);
});
