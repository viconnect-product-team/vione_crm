const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connected to PostgreSQL successfully.');

  // 1. Upgrade schema with necessary columns
  console.log('Adding extensions/columns if needed...');
  await client.query(`
    ALTER TABLE public.members ADD COLUMN IF NOT EXISTS department text;
    ALTER TABLE public.members ADD COLUMN IF NOT EXISTS executive_role text;
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS department text;
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS executive_role text;

    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_by_id text;
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_by_name text;
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone;
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_phone text;
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_company text;

    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fee bigint DEFAULT 0;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS seating_plan jsonb;

    ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
    ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'transfer';
    ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_amount bigint DEFAULT 0;
    ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_deadline timestamp with time zone;
    ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS reminder_count integer DEFAULT 0;
    ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS last_reminded_at timestamp with time zone;
    ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS seat_assignment text;
    ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS qr_payload text;
    ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checked_in_at timestamp with time zone;

    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS advance_amount bigint DEFAULT 0;
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS refund_amount bigint DEFAULT 0;
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS invoice_url text;
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS recipient text;

    ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS department text;
    ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS target_members jsonb;
    ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS zoom_url text;
    ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS cancel_reason text;

    ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS target_audience text DEFAULT 'all';
    ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS lucky_draw jsonb;
  `);
  console.log('Schema migration completed.');

  // 2. Clear old data completely (Clean slate)
  console.log('Clearing database tables...');
  
  // Drop delete-blocking triggers on child tables if present
  await client.query('DROP TRIGGER IF EXISTS bmfu_block_delete_trg ON public.business_meeting_follow_ups;');

  const tablesToTruncate = [
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
    'public.business_meeting_calendar_projections',
    'public.business_meeting_time_proposals',
    'public.business_meeting_proposals',
    'public.business_meeting_participants',
    'public.business_meeting_follow_ups',
    'public.business_meetings',
    'public.business_relationship_memory_feedback',
    'public.business_relationship_memory_links',
    'public.business_relationship_memory_sources',
    'public.business_relationship_memories',
    'public.business_relationship_memory_extraction_receipts',
    'public.business_connect_ai_tool_invocations',
    'public.business_connect_ai_result_feedback',
    'public.business_connect_ai_rate_counters',
    'public.business_connect_ai_requests',
    'public.business_connect_ai_results',
    'public.relationship_intelligence_interactions',
    'public.relationship_recommendation_dismissals',
    'public.relationship_intelligence_preferences',
    'public.community_opportunity_followup_events',
    'public.community_opportunity_followups',
    'public.community_join_requests',
    'public.community_invitations',
    'public.community_invite_templates',
    'public.bc_customer_tag_suggestion_feedback',
    'public.bc_customer_tag_suggestion_runs',
    'public.bc_customer_needs',
    'public.business_relationship_moment_reminders',
    'public.business_relationship_person_plans',
    'public.business_identity_showcase_items',
    'public.identity_nfc_tags',
    'public.identity_share_links',
    'public.identity_field_visibility',
    'public.business_identities',
    'public.user_device_sessions',
    'public.gn_reports',
    'public.gn_notifications',
    'public.gn_notification_prefs',
    'public.user_connections',
    'public.saved_card_tags',
    'public.saved_card_collections',
    'public.saved_business_cards',
    'public.relationship_events',
    'public.business_interactions',
    'public.business_availability_preferences',
    'public.business_calendar_accounts',
    'public.broadcast_notification_dismissals',
    'public.bc_admin_grants',
    'public.card_ai_import_history',
    'public.card_settings',
    'public.association_logo_history',
    'public.user_settings',
    'public.profiles',
    'public.business_card_interactions',
    'public.business_card_leads',
    'public.business_card_needs',
    'public.business_card_services',
    'public.business_card_skills',
    'public.member_business_cards',
    'public.company_members',
    'public.companies',
    'public.memberships',
    'public.members',
    'public.user_roles',
    'public.user_profiles',
    'public.auth_sessions',
    'public.refresh_tokens',
    'public.vione_users',
    'auth.users'
  ];

  for (const t of tablesToTruncate) {
    try {
      await client.query(`DELETE FROM ${t};`);
      console.log(`Cleaned ${t}`);
    } catch (e) {
      console.warn(`Warning clearing ${t}:`, e.message);
    }
  }

  // Restore trigger on business_meeting_follow_ups
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

  // 3. Ensure Association for CEO 1983
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
  console.log('Association CEO 1983 created/verified.');

  // 4. Hash passwords
  const salt = await bcrypt.genSalt(10);
  const hashAdmin123 = await bcrypt.hash('admin123', salt);
  const hash123456 = await bcrypt.hash('123456', salt);

  // 5. Define accounts
  // 6 Designated Accounts
  const designatedAccounts = [
    {
      id: '00000000-0000-4000-8000-000000000001',
      username: 'admin1@connect.vn',
      email: 'admin1@connect.vn',
      name: 'Trần Tuấn Anh',
      passwordHash: hashAdmin123,
      appRole: 'platform_admin',
      assocRole: 'admin',
      executiveRole: 'platform_admin',
      department: 'Ban Điều Hành Hệ Thống',
      title: 'Platform Administrator',
      phone: '0901000001',
      company: 'ViConnect Holdings'
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      username: 'admin@connect.vn',
      email: 'admin@connect.vn',
      name: 'Phạm Văn Vũ',
      passwordHash: hash123456,
      appRole: 'admin',
      assocRole: 'admin',
      executiveRole: 'admin',
      department: 'Ban Quản Trị',
      title: 'Quản trị viên Hệ thống',
      phone: '0901000002',
      company: 'ViOne Platform'
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      username: 'jamesnguyen@uranustech.vn',
      email: 'jamesnguyen@uranustech.vn',
      name: 'James Nguyễn',
      passwordHash: hash123456,
      appRole: 'admin',
      assocRole: 'admin',
      executiveRole: 'admin',
      department: 'Ban Chiến Lược Công Nghệ',
      phone: '0901000003',
      company: 'Uranus Tech'
    },
    {
      id: '00000000-0000-4000-8000-000000000004',
      username: 'demo.user@vione.vn',
      email: 'demo.user@vione.vn',
      name: 'Demo User',
      passwordHash: hash123456,
      appRole: 'member',
      assocRole: 'member',
      executiveRole: 'member',
      department: 'Hội viên VIONE',
      phone: '0901000004',
      company: 'VIONE Demo Corp'
    },
    {
      id: '00000000-0000-4000-8000-000000000005',
      username: 'peer1@vione.vn',
      email: 'peer1@vione.vn',
      name: 'Nguyen Hoang Nam',
      passwordHash: hash123456,
      appRole: 'member',
      assocRole: 'member',
      executiveRole: 'member',
      department: 'Hội viên VIONE',
      phone: '0901000005',
      company: 'Nam Phát Logistics'
    },
    {
      id: '00000000-0000-4000-8000-000000000006',
      username: 'peer2@vione.vn',
      email: 'peer2@vione.vn',
      name: 'Tran Thu Thao',
      passwordHash: hash123456,
      appRole: 'member',
      assocRole: 'member',
      executiveRole: 'member',
      department: 'Hội viên VIONE',
      phone: '0901000006',
      company: 'Thảo Điền Architecture'
    }
  ];

  // 10 CEO1983 Community Accounts mapped with executive roles and committees
  const ceoAccounts = [
    {
      id: 'c1983000-0000-4000-8000-000000000001',
      username: 'ceo.tongthuky@ceo1983.com',
      email: 'ceo.tongthuky@ceo1983.com',
      name: 'Lê Hoàng Long',
      passwordHash: hash123456,
      appRole: 'admin',
      assocRole: 'admin',
      executiveRole: 'tong_thu_ky',
      department: 'Ban Thư ký',
      phone: '0983000001',
      company: 'Tập Đoàn Hoàng Long',
      title: 'Tổng Thư Ký CLB CEO 1983'
    },
    {
      id: 'c1983000-0000-4000-8000-000000000002',
      username: 'ceo.thanhvien@ceo1983.com',
      email: 'ceo.thanhvien@ceo1983.com',
      name: 'Nguyễn Văn Cường',
      passwordHash: hash123456,
      appRole: 'admin',
      assocRole: 'admin',
      executiveRole: 'truong_ban_thanh_vien',
      department: 'Ban Thành viên',
      phone: '0983000002',
      company: 'Cường Thịnh Corp',
      title: 'Trưởng Ban Thành Viên'
    },
    {
      id: 'c1983000-0000-4000-8000-000000000003',
      username: 'ceo.taichinh@ceo1983.com',
      email: 'ceo.taichinh@ceo1983.com',
      name: 'Vũ Thu Trang',
      passwordHash: hash123456,
      appRole: 'admin',
      assocRole: 'admin',
      executiveRole: 'truong_ban_tai_chinh',
      department: 'Ban Tài chính',
      phone: '0983000003',
      company: 'Kiến Vàng Capital',
      title: 'Trưởng Ban Tài Chính'
    },
    {
      id: 'c1983000-0000-4000-8000-000000000004',
      username: 'ceo.truyenthong@ceo1983.com',
      email: 'ceo.truyenthong@ceo1983.com',
      name: 'Phạm Quang Huy',
      passwordHash: hash123456,
      appRole: 'admin',
      assocRole: 'admin',
      executiveRole: 'truong_ban_truyen_thong',
      department: 'Ban Truyền thông',
      phone: '0983000004',
      company: 'Huy Hoàng Media Group',
      title: 'Trưởng Ban Truyền Thông'
    },
    {
      id: 'c1983000-0000-4000-8000-000000000005',
      username: 'ceo.xuctien@ceo1983.com',
      email: 'ceo.xuctien@ceo1983.com',
      name: 'Hoàng Minh Tuấn',
      passwordHash: hash123456,
      appRole: 'admin',
      assocRole: 'admin',
      executiveRole: 'truong_ban_xuc_tien',
      department: 'Ban Xúc tiến thương mại',
      phone: '0983000005',
      company: 'Tuấn Minh Global Trade',
      title: 'Trưởng Ban Xúc Tiến Thương Mại'
    },
    {
      id: 'c1983000-0000-4000-8000-000000000006',
      username: 'ceo.member1@ceo1983.com',
      email: 'ceo.member1@ceo1983.com',
      name: 'Đỗ Thị Mai',
      passwordHash: hash123456,
      appRole: 'member',
      assocRole: 'member',
      executiveRole: 'member',
      department: 'Ban Thành viên',
      phone: '0983000006',
      company: 'EcoClean Vietnam',
      title: 'Hội viên Ban Thành viên'
    },
    {
      id: 'c1983000-0000-4000-8000-000000000007',
      username: 'ceo.member2@ceo1983.com',
      email: 'ceo.member2@ceo1983.com',
      name: 'Bùi Đức Thắng',
      passwordHash: hash123456,
      appRole: 'member',
      assocRole: 'member',
      executiveRole: 'member',
      department: 'Ban Xúc tiến thương mại',
      phone: '0983000007',
      company: 'Thắng Lợi XNK JSC',
      title: 'Hội viên Ban Xúc tiến thương mại'
    },
    {
      id: 'c1983000-0000-4000-8000-000000000008',
      username: 'ceo.member3@ceo1983.com',
      email: 'ceo.member3@ceo1983.com',
      name: 'Ngô Bảo Anh',
      passwordHash: hash123456,
      appRole: 'member',
      assocRole: 'member',
      executiveRole: 'member',
      department: 'Ban Truyền thông',
      phone: '0983000008',
      company: 'MediaPro Solution',
      title: 'Hội viên Ban Truyền thông'
    },
    {
      id: 'c1983000-0000-4000-8000-000000000009',
      username: 'ceo.member4@ceo1983.com',
      email: 'ceo.member4@ceo1983.com',
      name: 'Đinh Trọng Hiếu',
      passwordHash: hash123456,
      appRole: 'member',
      assocRole: 'member',
      executiveRole: 'member',
      department: 'Ban Tài chính',
      phone: '0983000009',
      company: 'Tài Chính Việt An',
      title: 'Hội viên Ban Tài chính'
    },
    {
      id: 'c1983000-0000-4000-8000-000000000010',
      username: 'ceo.member5@ceo1983.com',
      email: 'ceo.member5@ceo1983.com',
      name: 'Trịnh Kim Oanh',
      passwordHash: hash123456,
      appRole: 'member',
      assocRole: 'member',
      executiveRole: 'member',
      department: 'Ban Thư ký',
      phone: '0983000010',
      company: 'An Phát Holding',
      title: 'Hội viên Ban Thư ký'
    }
  ];

  const allAccounts = [...designatedAccounts, ...ceoAccounts];

  for (let i = 0; i < allAccounts.length; i++) {
    const acc = allAccounts[i];
    const memberCode = `M1983-${String(i + 1).padStart(3, '0')}`;

    // 1. auth.users
    await client.query(`
      INSERT INTO auth.users (id, email, role)
      VALUES ($1, $2, 'authenticated')
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;
    `, [acc.id, acc.email]);

    // 2. public.vione_users
    await client.query(`
      INSERT INTO public.vione_users (
        id, username, password, email, name, email_verified, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, true, now(), now()
      )
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        email = EXCLUDED.email,
        name = EXCLUDED.name;
    `, [acc.id, acc.username, acc.passwordHash, acc.email, acc.name]);

    // 3. public.user_roles
    await client.query(`
      INSERT INTO public.user_roles (id, user_id, role, created_at)
      VALUES (gen_random_uuid(), $1, $2::app_role, now());
    `, [acc.id, acc.appRole]);

    // 4. public.user_profiles
    await client.query(`
      INSERT INTO public.user_profiles (
        user_id, display_name, professional_title, company_name, onboarding_status, account_status
      ) VALUES (
        $1, $2, $3, $4, 'completed'::onboarding_status, 'active'::account_status
      )
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        professional_title = EXCLUDED.professional_title,
        company_name = EXCLUDED.company_name;
    `, [acc.id, acc.name, acc.title || acc.executiveRole, acc.company]);

    // 4.1 public.business_identities
    await client.query(`
      INSERT INTO public.business_identities (
        id, owner_user_id, display_name, job_title, company_name, primary_email, status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, 'active', now(), now()
      )
      ON CONFLICT (owner_user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        job_title = EXCLUDED.job_title,
        company_name = EXCLUDED.company_name,
        primary_email = EXCLUDED.primary_email,
        updated_at = now();
    `, [acc.id, acc.name, acc.title || acc.executiveRole, acc.company, acc.email]);

    // 5. public.members
    await client.query(`
      INSERT INTO public.members (
        id, code, name, contact, email, phone, type, level, industry, region, status,
        joined_at, fee_year, fee_paid, address, about, created_at, updated_at,
        user_id, association_id, payment_status, department, executive_role
      ) VALUES (
        $1, $2, $3, $3, $4, $5, 'enterprise', 'vip', 'Đa ngành', 'Hà Nội', 'active',
        CURRENT_DATE, 2026, true, 'Hà Nội, Việt Nam', $6, now(), now(),
        $7, $8, 'paid', $9, $10
      );
    `, [
      acc.id, memberCode, acc.name, acc.email, acc.phone,
      `${acc.company} • ${acc.title || acc.department}`,
      acc.id, assocId, acc.department, acc.executiveRole
    ]);

    // 6. public.memberships
    await client.query(`
      INSERT INTO public.memberships (
        id, user_id, association_id, role, is_default, department, executive_role, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3::app_role, true, $4, $5, now(), now()
      );
    `, [acc.id, assocId, acc.assocRole === 'admin' ? 'admin' : 'member', acc.department, acc.executiveRole]);

    // 7. public.member_business_cards
    const cardSlug = `card-${acc.username.split('@')[0].replace(/[^a-zA-Z0-9]/g, '-')}`;
    await client.query(`
      INSERT INTO public.member_business_cards (
        id, association_id, owner_user_id, member_id, display_name, company_name, professional_title,
        work_email, work_phone, bio, status, slug, card_kind, public_mode, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', $10, 'primary', 'public', now(), now()
      );
    `, [
      assocId, acc.id, acc.id, acc.name, acc.company, acc.title || acc.department,
      acc.email, acc.phone, `Chuyên gia kết nối • ${acc.company}`, cardSlug
    ]);

    console.log(`Seeded account: [${acc.username}] (Pass: ${acc.username === 'admin1@connect.vn' ? 'admin123' : '123456'}) - Role: ${acc.executiveRole} - ${acc.department}`);
  }

  // 6. Seed an official High-Profile Event with seating plan & fee
  console.log('Seeding official event with seating plan...');
  const eventId = 'EVT-1983-GALA-2026';
  const seatingPlan = {
    totalTables: 8,
    seatsPerTable: 10,
    tables: [
      { id: 'VIP-01', name: 'Bàn VIP 01 (Ban Thường Vụ)', category: 'VIP', seats: 10, assigned: 6 },
      { id: 'VIP-02', name: 'Bàn VIP 02 (Khách Mời Danh Dự)', category: 'VIP', seats: 10, assigned: 4 },
      { id: 'TB-03', name: 'Bàn 03 (Ban Xúc Tiến Giao Thương)', category: 'STANDARD', seats: 10, assigned: 5 },
      { id: 'TB-04', name: 'Bàn 04 (Ban Truyền Thông & Sự Kiện)', category: 'STANDARD', seats: 10, assigned: 3 },
      { id: 'TB-05', name: 'Bàn 05 (Ban Tài Chính & Pháp Lý)', category: 'STANDARD', seats: 10, assigned: 4 },
      { id: 'TB-06', name: 'Bàn 06 (Khối Sản Xuất & Bất Động Sản)', category: 'STANDARD', seats: 10, assigned: 7 },
      { id: 'TB-07', name: 'Bàn 07 (Khối Công Nghệ & F&B)', category: 'STANDARD', seats: 10, assigned: 5 },
      { id: 'TB-08', name: 'Bàn 08 (Khách Mời Doanh Nghiệp Mới)', category: 'GUEST', seats: 10, assigned: 2 }
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

  // Seed Event Registrations with check-in QR & seat assignments
  const seats = [
    'Bàn VIP 01 - Ghế 01', 'Bàn VIP 01 - Ghế 02', 'Bàn VIP 01 - Ghế 03', 'Bàn VIP 01 - Ghế 04',
    'Bàn VIP 02 - Ghế 01', 'Bàn VIP 02 - Ghế 02', 'Bàn 03 - Ghế 01', 'Bàn 04 - Ghế 01',
    'Bàn 05 - Ghế 01', 'Bàn 06 - Ghế 01'
  ];

  for (let i = 0; i < ceoAccounts.length; i++) {
    const acc = ceoAccounts[i];
    const regId = `REG-1983-${String(i + 1).padStart(3, '0')}`;
    const qrPayload = JSON.stringify({
      regId,
      eventId,
      userId: acc.id,
      name: acc.name,
      phone: acc.phone,
      company: acc.company,
      seat: seats[i] || `Bàn A - Ghế ${i + 1}`,
      paymentStatus: i < 7 ? 'paid' : 'pending',
      amount: 500000
    });

    await client.query(`
      INSERT INTO public.event_registrations (
        id, event_id, member_code, member_name, email, registered_at, status, ticket_type,
        payment_status, payment_method, payment_amount, payment_deadline, reminder_count,
        seat_assignment, qr_payload, created_at, updated_at, association_id
      ) VALUES (
        $1, $2, $3, $4, $5, CURRENT_DATE, 'confirmed', 'VIP Pass',
        $6, $7, 500000, CURRENT_DATE + INTERVAL '3 days', $8,
        $9, $10, now(), now(), $11
      );
    `, [
      regId, eventId, `M1983-${String(i + 1).padStart(3, '0')}`, acc.name, acc.email,
      i < 7 ? 'paid' : 'pending',
      i % 2 === 0 ? 'transfer' : 'cash',
      i >= 7 ? 1 : 0,
      seats[i] || `Bàn 07 - Ghế ${i + 1}`,
      qrPayload,
      assocId
    ]);
  }

  // 7. Seed Opportunities with Receiver/Claim tracking
  console.log('Seeding business opportunities...');
  const opp1Id = 'OPP-1983-001';
  await client.query(`
    INSERT INTO public.opportunities (
      id, poster_id, title, description, type, budget_min, budget_max, region, industry, deadline,
      status, views, emoji, association_id, created_at, updated_at,
      claimed_by_id, claimed_by_name, claimed_at, claimed_phone, claimed_company
    ) VALUES (
      $1, $2,
      'Cần tìm nhà thầu cung cấp giải pháp chuyển đổi số & CRM ERP cho chuỗi 20 showroom',
      'Yêu cầu đơn vị có năng lực triển khai hệ thống quản trị dữ liệu khách hàng, tích hợp Zalo Mini App và đồng bộ kho hàng theo thời gian thực.',
      'partnership', 500000000, 1200000000, 'Toàn quốc', 'Công nghệ & Viễn thông',
      now() + INTERVAL '30 days', 'open', 156, '💼', $3, now(), now(),
      $4, $5, now() - INTERVAL '2 hours', '0901000003', 'Uranus Tech'
    );
  `, [
    opp1Id,
    ceoAccounts[0].id,
    assocId,
    designatedAccounts[2].id, // claimed by James Nguyễn
    designatedAccounts[2].name
  ]);

  const opp2Id = 'OPP-1983-002';
  await client.query(`
    INSERT INTO public.opportunities (
      id, poster_id, title, description, type, budget_min, budget_max, region, industry, deadline,
      status, views, emoji, association_id, created_at, updated_at
    ) VALUES (
      $1, $2,
      'Cung cấp nguyên liệu bao bì sinh học tự hủy xuất khẩu EU số lượng lớn',
      'Năng lực cung ứng 50 tấn/tháng đạt chứng nhận TUV Rheinland và chuẩn xuất khẩu thị trường Châu Âu.',
      'supply', 2000000000, 5000000000, 'Miền Bắc', 'Sản xuất & Xuất nhập khẩu',
      now() + INTERVAL '45 days', 'open', 89, '📦', $3, now(), now()
    );
  `, [opp2Id, ceoAccounts[4].id, assocId]);

  // Insert interests
  await client.query(`
    INSERT INTO public.opportunity_interests (
      id, opportunity_id, member_id, message, contact, interest_level, created_at, association_id
    ) VALUES (
      'INT-001', $1, $2, 'Uranus Tech đã nhận kết nối và hoàn thành báo giá kỹ thuật.', '0901000003', 'high', now(), $3
    );
  `, [opp1Id, designatedAccounts[2].id, assocId]);

  // 8. Seed Transactions (Thu / Chi / Tạm ứng / Hoàn ứng)
  console.log('Seeding Income & Expense transactions with advances and invoices...');
  const txData = [
    {
      code: 'THU-2026-001',
      date: '2026-09-01',
      type: 'income',
      category: 'membership_fee',
      description: 'Thu hội phí gia nhập thường niên 2026 - Lê Hoàng Long',
      amount: 15000000,
      method: 'bank',
      status: 'completed',
      invoiceUrl: '/invoices/INV-THU-001.pdf',
      advanceAmount: 0,
      refundAmount: 0,
      recipient: 'CLB CEO 1983'
    },
    {
      code: 'THU-2026-002',
      date: '2026-09-03',
      type: 'income',
      category: 'event_fee',
      description: 'Thu vé tham dự Gala Kỷ Nguyên 5000 Tỷ - Tiền mặt tại văn phòng',
      amount: 5000000,
      method: 'cash',
      status: 'completed',
      invoiceUrl: '/invoices/INV-THU-002.pdf',
      advanceAmount: 0,
      refundAmount: 0,
      recipient: 'Ban Thư Ký'
    },
    {
      code: 'CHI-2026-001',
      date: '2026-09-05',
      type: 'expense',
      category: 'advance',
      description: 'Tạm ứng tổ chức sự kiện Gala (Đặt cọc địa điểm & âm thanh ánh sáng)',
      amount: 30000000,
      method: 'bank',
      status: 'completed',
      invoiceUrl: '/invoices/INV-CHI-001.pdf',
      advanceAmount: 30000000,
      refundAmount: 5000000, // Hoàn ứng 5 triệu tiền thừa
      recipient: 'Phạm Quang Huy (Trưởng ban Truyền thông)'
    },
    {
      code: 'CHI-2026-002',
      date: '2026-09-08',
      type: 'expense',
      category: 'operation',
      description: 'Chi phí in ấn kỷ yếu danh bạ CEO 1983 và thẻ VIP Titanium NFC',
      amount: 18500000,
      method: 'cash',
      status: 'completed',
      invoiceUrl: '/invoices/INV-CHI-002.pdf',
      advanceAmount: 0,
      refundAmount: 0,
      recipient: 'Xưởng in Quốc Gia'
    }
  ];

  for (const tx of txData) {
    await client.query(`
      INSERT INTO public.transactions (
        id, code, date, type, category, description, amount, method, status,
        advance_amount, refund_amount, invoice_url, recipient, created_at, updated_at, association_id
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now(), $13
      );
    `, [
      tx.code, tx.date, tx.type, tx.category, tx.description, tx.amount, tx.method, tx.status,
      tx.advanceAmount, tx.refundAmount, tx.invoiceUrl, tx.recipient, assocId
    ]);
  }

  // 9. Seed Department Meetings & Voting
  console.log('Seeding Department Meetings & Voting...');
  await client.query(`
    INSERT INTO public.meetings (
      id, code, title, type, date, time, location, attendees, status, department, target_members, zoom_url, created_at, updated_at, association_id
    ) VALUES (
      gen_random_uuid(), 'MEET-1983-001',
      'Họp Ban Xúc Tiến Thương Mại: Triển khai matching cung cầu tháng 9',
      'committee', CURRENT_DATE + INTERVAL '3 days', '14:30',
      'Zoom Meeting ID: 888 1983 9999 (Pass: 1983)', 8, 'upcoming',
      'Ban Xúc tiến thương mại',
      $1, 'https://zoom.us/j/88819839999', now(), now(), $2
    );
  `, [
    JSON.stringify([
      { id: ceoAccounts[4].id, name: ceoAccounts[4].name, email: ceoAccounts[4].email, role: 'Trưởng ban' },
      { id: ceoAccounts[6].id, name: ceoAccounts[6].name, email: ceoAccounts[6].email, role: 'Thành viên' }
    ]),
    assocId
  ]);

  await client.query(`
    INSERT INTO public.votes (
      id, title, type, starts_at, ends_at, eligible, voted, status, target_audience, lucky_draw, options, created_at, updated_at, association_id
    ) VALUES (
      'VOTE-1983-001',
      'Khảo sát ý kiến đóng góp & Bốc thăm trúng thưởng VIP Pass 2027',
      'general', CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 150, 42, 'open',
      'non_members',
      $1,
      $2,
      now(), now(), $3
    );
  `, [
    JSON.stringify({
      enabled: true,
      prizes: [
        { id: 'P1', name: '01 Thẻ Titanium Member VIP Pass 1 năm trị giá 20.000.000đ', count: 1 },
        { id: 'P2', name: '03 Vé tham dự Gala Doanh Nhân & Tiệc Tối Khép Kín', count: 3 }
      ],
      drawn: false,
      winners: []
    }),
    JSON.stringify([
      { id: 'OPT-1', text: 'Mở rộng giao thương quốc tế khu vực ASEAN', votes: 24 },
      { id: 'OPT-2', text: 'Thành lập Quỹ đầu tư mạo hiểm nội bộ CEO 1983 Angel Fund', votes: 18 }
    ]),
    assocId
  ]);

  // 10. Seed Official News Articles
  console.log('Seeding Official CEO 1983 News Articles...');
  await client.query(`
    INSERT INTO public.news (
      id, code, title, category, author, published_at, views, status, excerpt, association_id, created_at, updated_at
    ) VALUES 
    (
      gen_random_uuid(), 'NEWS-1983-001',
      'CEO 1983 công bố chiến lược chuyển đổi số và kết nối giao thương 5.000 tỷ đồng',
      'Chiến lược & Hợp tác',
      'Lê Hoàng Long - Chủ tịch CLB',
      '2026-09-10',
      342,
      'published',
      'Tại hội nghị ban điều hành quý 3/2026, CLB Doanh Nhân CEO 1983 chính thức ra mắt nền tảng số ViOne Business Connect, giúp tối ưu hóa luồng giao thương nội bộ, tổ chức đại hội thường niên và chia sẻ cơ hội kinh doanh đa ngành.',
      $1, now() - INTERVAL '1 day', now()
    ),
    (
      gen_random_uuid(), 'NEWS-1983-002',
      'Hướng dẫn đăng ký tham dự Gala Kỷ Nguyên Bứt Phá & Tiệc Tối Khép Kín 2026',
      'Sự kiện & Hoạt động',
      'Ban Thư Ký',
      '2026-09-11',
      198,
      'published',
      'Sự kiện quy tụ hơn 150 lãnh đạo doanh nghiệp tiêu biểu của Thủ đô Hà Nội. Hội viên và khách mời có thể đăng ký trực tiếp trên ứng dụng VIONE, thanh toán VietQR tự động và nhận vé điện tử QR Code định danh bàn VIP.',
      $1, now(), now()
    );
  `, [assocId]);

  console.log('--- ALL DATA CLEARED & SEEDED SUCCESSFULLY ---');
  await client.end();
}

main().catch(err => {
  console.error('Fatal error during clean and seed:', err);
  process.exit(1);
});
