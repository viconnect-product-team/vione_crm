const { Client } = require('pg');
const crypto = require('crypto');

const adminId = '00000000-0000-0000-0000-000000000000';
const peer1Id = '93de8236-fafd-45c4-97b9-2a0e2dc3db83';
const peer2Id = 'e3de1319-d8fa-4b8f-ae09-59f4733e6168';
const peer3Id = '4f15cc7d-6e30-4192-ac9c-290ace8ea71d';
const peer4Id = '200d9302-c5b6-4f2c-8eca-9c51cf6284fc';

const assoc1Id = '3d668c0e-a309-46c5-a2f5-c7d5b8cb038b'; // Hiệp hội mặc định
const assoc2Id = 'c1000000-0000-4000-8000-000000000002'; // AI Vietnam
const assoc3Id = 'c1000000-0000-4000-8000-000000000003'; // EdTech Connect

async function seedMembers(client, associationId, count) {
  console.log(`Seeding ${count} members for association ${associationId}...`);
  for (let i = 0; i < count; i++) {
    const id = crypto.randomUUID();
    const code = `MEM-${associationId.slice(0, 4)}-${i}`;
    const name = `Hội viên ${i + 1}`;
    const contact = `Representative ${i + 1}`;
    const email = `member-${associationId.slice(0, 4)}-${i}@test.com`;
    const phone = `090000000${i}`;
    
    await client.query(`
      INSERT INTO public.members (
        id, code, name, contact, email, phone, type, level, industry, region, status, 
        joined_at, fee_year, fee_paid, address, about, reminder_count, 
        created_at, updated_at, association_id, payment_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'Enterprise', 'Standard', 'Technology', 'Hà Nội', 'active',
        CURRENT_DATE, 2026, true, 'Address info', 'About info', 0,
        NOW(), NOW(), $7::uuid, 'paid'
      )
      ON CONFLICT DO NOTHING
    `, [id, code, name, contact, email, phone, associationId]);
  }
}

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();
  console.log('Connected to vione_app database.');

  // Create temporary mock bypass for auth user created triggers
  console.log('Replacing public.handle_new_user with seeder bypass...');
  await client.query(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  console.log('Clearing old mock data...');
  const assocIds = [assoc1Id, assoc2Id, assoc3Id];

  await client.query(`DELETE FROM public.business_relationship_moment_media`);
  await client.query(`DELETE FROM public.business_relationship_moments`);
  await client.query(`DELETE FROM public.guest_contacts`);
  await client.query(`DELETE FROM public.saved_business_cards`);
  await client.query(`DELETE FROM public.user_connections`);
  
  await client.query(`DELETE FROM public.members WHERE association_id = ANY($1::uuid[])`, [assocIds]);
  await client.query(`DELETE FROM public.memberships WHERE association_id = ANY($1::uuid[])`, [assocIds]);
  await client.query(`DELETE FROM public.events WHERE association_id = ANY($1::uuid[])`, [assocIds]);
  await client.query(`DELETE FROM public.opportunities WHERE association_id = ANY($1::uuid[])`, [assocIds]);

  console.log('Inserting auth.users...');
  const users = [
    { id: adminId, email: 'admin@connect.vn', name: 'Administrator', username: 'admin@connect.vn' },
    { id: peer1Id, email: 'jamesnguyen@uranustech.vn', name: 'James Nguyen', username: 'jamesnguyen@uranustech.vn' },
    { id: peer2Id, email: 'demo.user@vione.vn', name: 'Demo User', username: 'demo.user@vione.vn' },
    { id: peer3Id, email: 'peer1@vione.vn', name: 'Nguyen Hoang Nam', username: 'peer1@vione.vn' },
    { id: peer4Id, email: 'peer2@vione.vn', name: 'Tran Thu Thao', username: 'peer2@vione.vn' }
  ];

  for (const u of users) {
    await client.query(`
      INSERT INTO auth.users (id, email, role)
      VALUES ($1::uuid, $2, 'authenticated')
      ON CONFLICT (id) DO NOTHING
    `, [u.id, u.email]);

    await client.query(`
      INSERT INTO public.vione_users (id, username, password, email, name, email_verified)
      VALUES ($1::uuid, $2, 'mock-password-hash', $3, $4, true)
      ON CONFLICT (id) DO NOTHING
    `, [u.id, u.username, u.email, u.name]);
  }

  console.log('Inserting user profiles...');
  const profiles = [
    { user_id: adminId, display_name: 'Administrator', professional_title: 'Hệ Thống Admin', company_name: 'VIONE Group', industry: 'Công nghệ', region: 'Hà Nội', bio: 'Quản trị viên hệ thống Viconnect' },
    { user_id: peer1Id, display_name: 'James Nguyen', professional_title: 'Giám đốc Công nghệ', company_name: 'UranusTech', industry: 'Công nghệ', region: 'Hồ Chí Minh', bio: 'Đam mê phát triển AI' },
    { user_id: peer2Id, display_name: 'Demo User', professional_title: 'Trưởng phòng Nhân sự', company_name: 'VIONE Hub', industry: 'Nhân sự', region: 'Hà Nội', bio: 'Kết nối nhân sự thời đại số' },
    { user_id: peer3Id, display_name: 'Nguyen Hoang Nam', professional_title: 'Sáng lập viên', company_name: 'Nam Group', industry: 'Bất động sản', region: 'Hà Nội', bio: 'Kinh doanh bất động sản' },
    { user_id: peer4Id, display_name: 'Tran Thu Thao', professional_title: 'Giám đốc Marketing', company_name: 'Thao Creative', industry: 'Truyền thông', region: 'Hồ Chí Minh', bio: 'Chuyên gia thương hiệu số' }
  ];

  for (const p of profiles) {
    await client.query(`
      INSERT INTO public.user_profiles (user_id, display_name, professional_title, company_name, industry, region, bio, locale, timezone, onboarding_status, account_status)
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, 'vi', 'Asia/Ho_Chi_Minh', 'completed', 'active')
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        professional_title = EXCLUDED.professional_title,
        company_name = EXCLUDED.company_name,
        industry = EXCLUDED.industry,
        region = EXCLUDED.region,
        bio = EXCLUDED.bio,
        updated_at = now()
    `, [p.user_id, p.display_name, p.professional_title, p.company_name, p.industry, p.region, p.bio]);
  }

  console.log('Inserting business identities...');
  const identities = [
    { id: '11111111-1111-1111-1111-111111111111', owner_user_id: adminId, display_name: 'Administrator', job_title: 'Hệ Thống Admin', company_name: 'VIONE Group', bio: 'Quản trị viên hệ thống Viconnect', primary_email: 'admin@connect.vn', primary_phone: '0901234567', city: 'Hà Nội' },
    { id: '22222222-2222-2222-2222-222222222222', owner_user_id: peer1Id, display_name: 'James Nguyen', job_title: 'Giám đốc Công nghệ', company_name: 'UranusTech', bio: 'Đam mê phát triển AI', primary_email: 'jamesnguyen@uranustech.vn', primary_phone: '0911234567', city: 'Hồ Chí Minh' },
    { id: '33333333-3333-3333-3333-333333333333', owner_user_id: peer2Id, display_name: 'Demo User', job_title: 'Trưởng phòng Nhân sự', company_name: 'VIONE Hub', bio: 'Kết nối nhân sự thời đại số', primary_email: 'demo.user@vione.vn', primary_phone: '0921234567', city: 'Hà Nội' },
    { id: '44444444-4444-4444-4444-444444444444', owner_user_id: peer3Id, display_name: 'Nguyen Hoang Nam', job_title: 'Sáng lập viên', company_name: 'Nam Group', bio: 'Kinh doanh bất động sản', primary_email: 'peer1@vione.vn', primary_phone: '0931234567', city: 'Hà Nội' },
    { id: '55555555-5555-5555-5555-555555555555', owner_user_id: peer4Id, display_name: 'Tran Thu Thao', job_title: 'Giám đốc Marketing', company_name: 'Thao Creative', bio: 'Chuyên gia thương hiệu số', primary_email: 'peer2@vione.vn', primary_phone: '0941234567', city: 'Hồ Chí Minh' }
  ];

  for (const i of identities) {
    const existing = await client.query(
      `SELECT id FROM public.business_identities WHERE owner_user_id = $1::uuid LIMIT 1`,
      [i.owner_user_id]
    );
    const targetId = existing.rows[0]?.id || i.id;

    await client.query(`
      INSERT INTO public.business_identities (id, owner_user_id, display_name, job_title, company_name, bio, primary_email, primary_phone, city, status, created_at, updated_at)
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, 'active', now(), now())
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        job_title = EXCLUDED.job_title,
        company_name = EXCLUDED.company_name,
        bio = EXCLUDED.bio,
        primary_email = EXCLUDED.primary_email,
        primary_phone = EXCLUDED.primary_phone,
        city = EXCLUDED.city,
        updated_at = now()
    `, [targetId, i.owner_user_id, i.display_name, i.job_title, i.company_name, i.bio, i.primary_email, i.primary_phone, i.city]);
  }

  console.log('Inserting associations...');
  const associations = [
    { id: assoc1Id, name: 'Hiệp hội mặc định', slug: 'mac-dinh', tagline: 'Hiệp hội mặc định vione', about: 'Nơi kết nối mọi doanh nghiệp.' },
    { id: assoc2Id, name: 'AI Vietnam', slug: 'ai-vietnam', tagline: 'Cộng đồng AI lớn nhất Việt Nam', about: 'Thúc đẩy nghiên cứu và ứng dụng Trí tuệ Nhân tạo.' },
    { id: assoc3Id, name: 'EdTech Connect', slug: 'edtech-connect', tagline: 'Công nghệ giáo dục tương lai', about: 'Mạng lưới kết nối các đơn vị làm giáo dục số.' }
  ];

  for (const a of associations) {
    await client.query(`
      INSERT INTO public.associations (id, name, slug, tagline, about, created_at, updated_at)
      VALUES ($1::uuid, $2, $3, $4, $5, now(), now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        tagline = EXCLUDED.tagline,
        about = EXCLUDED.about,
        updated_at = now()
    `, [a.id, a.name, a.slug, a.tagline, a.about]);
  }

  console.log('Inserting memberships...');
  const memberships = [
    { user_id: adminId, association_id: assoc1Id, role: 'member', is_default: true },
    { user_id: adminId, association_id: assoc2Id, role: 'admin', is_default: false },
    { user_id: adminId, association_id: assoc3Id, role: 'member', is_default: false }
  ];

  for (const m of memberships) {
    await client.query(`
      INSERT INTO public.memberships (user_id, association_id, role, is_default, created_at, updated_at)
      VALUES ($1::uuid, $2::uuid, $3, $4, now(), now())
      ON CONFLICT (user_id, association_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_default = EXCLUDED.is_default,
        updated_at = now()
    `, [m.user_id, m.association_id, m.role, m.is_default]);
  }

  // Seed 3 members for each association
  await seedMembers(client, assoc1Id, 3);
  await seedMembers(client, assoc2Id, 3);
  await seedMembers(client, assoc3Id, 3);

  console.log('Inserting events...');
  const events = [
    // 3 events for Hiệp hội mặc định
    { id: crypto.randomUUID(), name: 'Hội thảo SME Kết Nối 1', date: '2026-09-01', location: 'Văn phòng Hiệp hội', capacity: 100, registered: 10, status: 'active', type: 'offline', association_id: assoc1Id },
    { id: crypto.randomUUID(), name: 'Hội thảo SME Kết Nối 2', date: '2026-09-15', location: 'Văn phòng Hiệp hội', capacity: 100, registered: 20, status: 'active', type: 'offline', association_id: assoc1Id },
    { id: crypto.randomUUID(), name: 'Đại hội Thường Niên', date: '2026-10-15', location: 'Trung tâm Hội nghị Quốc gia', capacity: 200, registered: 50, status: 'active', type: 'offline', association_id: assoc1Id },
    
    // 3 events for AI Vietnam
    { id: crypto.randomUUID(), name: 'AI Summit 2026', date: '2026-09-10', location: 'GEM Center', capacity: 500, registered: 450, status: 'active', type: 'offline', association_id: assoc2Id },
    { id: crypto.randomUUID(), name: 'GenAI Webinar', date: '2026-09-20', location: 'Zoom Meeting', capacity: 1000, registered: 800, status: 'active', type: 'online', association_id: assoc2Id },
    { id: crypto.randomUUID(), name: 'AI Hackathon', date: '2026-10-05', location: 'Đại học Bách Khoa', capacity: 300, registered: 120, status: 'active', type: 'offline', association_id: assoc2Id },
    
    // 3 events for EdTech Connect
    { id: crypto.randomUUID(), name: 'Diễn đàn EdTech', date: '2026-09-15', location: 'Hanoi Club', capacity: 150, registered: 90, status: 'active', type: 'offline', association_id: assoc3Id },
    { id: crypto.randomUUID(), name: 'E-Learning Workshop', date: '2026-10-02', location: 'Zoom Meeting', capacity: 500, registered: 200, status: 'active', type: 'online', association_id: assoc3Id },
    { id: crypto.randomUUID(), name: 'Education Tech Show', date: '2026-10-30', location: 'Sofitel Plaza', capacity: 80, registered: 40, status: 'active', type: 'offline', association_id: assoc3Id }
  ];

  for (const e of events) {
    await client.query(`
      INSERT INTO public.events (id, name, date, location, capacity, registered, status, type, association_id, qr_fields, created_at, updated_at)
      VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9::uuid, ARRAY[]::text[], now(), now())
    `, [e.id, e.name, e.date, e.location, e.capacity, e.registered, e.status, e.type, e.association_id]);
  }

  console.log('Inserting opportunities...');
  const opportunities = [
    // 3 opportunities for Hiệp hội mặc định
    { id: crypto.randomUUID(), title: 'Cần tìm đối tác in ấn bao bì hộp giấy', description: 'Số lượng ban đầu 10,000 hộp.', type: 'buy', deadline: '2026-12-31', status: 'open', association_id: assoc1Id },
    { id: crypto.randomUUID(), title: 'Dịch vụ tư vấn pháp lý thuế cuối năm', description: 'Gói hỗ trợ doanh nghiệp SME thành viên.', type: 'sell', deadline: '2026-11-30', status: 'open', association_id: assoc1Id },
    { id: crypto.randomUUID(), title: 'Hợp tác chuyển đổi số văn phòng', description: 'Cần đơn vị triển khai phần mềm quản lý.', type: 'collaboration', deadline: '2026-10-15', status: 'open', association_id: assoc1Id },
    
    // 3 opportunities for AI Vietnam
    { id: crypto.randomUUID(), title: 'Cần tìm chuyên gia tư vấn giải pháp AI Chatbot', description: 'Tích hợp CRM doanh nghiệp.', type: 'buy', deadline: '2026-10-01', status: 'open', association_id: assoc2Id },
    { id: crypto.randomUUID(), title: 'Cung cấp API nhận dạng tiếng Việt độ chính xác cao', description: 'Công nghệ ASR tiên tiến.', type: 'sell', deadline: '2026-10-15', status: 'open', association_id: assoc2Id },
    { id: crypto.randomUUID(), title: 'Tìm đối tác hợp tác dự án xử lý hình ảnh y tế', description: 'Sử dụng mô hình Vision-Language.', type: 'collaboration', deadline: '2026-11-01', status: 'open', association_id: assoc2Id },
    
    // 3 opportunities for EdTech Connect
    { id: crypto.randomUUID(), title: 'Cần mua bản quyền nội dung khóa học tiếng Anh trẻ em', description: 'Chuẩn CEFR.', type: 'buy', deadline: '2026-11-01', status: 'open', association_id: assoc3Id },
    { id: crypto.randomUUID(), title: 'Cung cấp hệ thống LMS tùy biến cao', description: 'Hỗ trợ SCORM và xAPI.', type: 'sell', deadline: '2026-10-15', status: 'open', association_id: assoc3Id },
    { id: crypto.randomUUID(), title: 'Tìm trường học liên kết thí điểm ứng dụng kính VR', description: 'Môn học Lịch sử và Địa lý.', type: 'collaboration', deadline: '2026-12-01', status: 'open', association_id: assoc3Id }
  ];

  for (const o of opportunities) {
    await client.query(`
      INSERT INTO public.opportunities (id, poster_id, title, description, type, deadline, status, views, emoji, association_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6::timestamp with time zone, $7, 0, '💡', $8::uuid, now(), now())
    `, [o.id, adminId, o.title, o.description, o.type, o.deadline, o.status, o.association_id]);
  }

  console.log('Inserting connection requests...');
  // Seed James Nguyen and Demo User connections (max 3 connections)
  await client.query(`
    INSERT INTO public.user_connections (id, requester_user_id, recipient_user_id, status, source_type, requested_at, responded_at, created_at, updated_at)
    VALUES ($1::uuid, $2::uuid, $3::uuid, 'accepted'::public.global_connection_status, 'manual'::public.global_connection_source_type, now(), now(), now(), now())
  `, [crypto.randomUUID(), peer1Id, adminId]);

  console.log('Inserting saved business cards...');
  const existingCard = await client.query(`SELECT id FROM public.member_business_cards LIMIT 1`);
  const targetCardId = existingCard.rows[0]?.id || 'db00f90c-fd89-4525-bf5d-aadb0211b54a';

  await client.query(`
    INSERT INTO public.saved_business_cards (id, owner_user_id, target_card_id, saved_at, created_at, updated_at, archived)
    VALUES ($1::uuid, $2::uuid, $3::uuid, now(), now(), now(), false)
  `, [crypto.randomUUID(), adminId, targetCardId]);

  console.log('Inserting guest contacts matching "Gặp gần đây" screenshot...');
  // Exactly 3 guest contacts
  const guestContacts = [
    {
      id: crypto.randomUUID(),
      display_name: 'Thu Trà',
      phone: '0981112222',
      email: 'thutra@gmail.com',
      title: 'Designer',
      company_name: 'VIONE Design',
      owner_note: 'Gặp tại GEM Center',
      owner_label: 'Khách hàng',
      source: 'contact_shared',
      offset_days: 2
    },
    {
      id: crypto.randomUUID(),
      display_name: 'Lê Thu Hà',
      phone: '0985556666',
      email: 'thuha@gmail.com',
      title: 'Giám đốc Marketing',
      company_name: 'NextGen',
      owner_note: 'Hẹn lịch thảo luận PR',
      owner_label: 'Khách hàng',
      source: 'contact_shared',
      offset_days: 22
    },
    {
      id: crypto.randomUUID(),
      display_name: 'P. Anh Tu...',
      phone: '0987778888',
      email: 'anhtuan@gmail.com',
      title: 'Giám đốc Vận hành',
      company_name: 'Thành Đạt',
      owner_note: 'Gặp trao đổi quy trình VH',
      owner_label: 'Đối tác',
      source: 'contact_shared',
      offset_days: 27
    }
  ];

  for (const gc of guestContacts) {
    const occurredAt = new Date(Date.now() - gc.offset_days * 24 * 3600 * 1000);
    await client.query(`
      INSERT INTO public.guest_contacts (
        id, owner_user_id, display_name, phone, email, 
        title, company_name, owner_note, owner_label, source, client_token, first_shared_at, last_shared_at, created_at, updated_at
      ) VALUES (
        $1::uuid, $2::uuid, $3, $4, $5, 
        $6, $7, $8, $9, $10, $11, $12::timestamp with time zone, $12::timestamp with time zone, $12::timestamp with time zone, $12::timestamp with time zone
      )
    `, [gc.id, adminId, gc.display_name, gc.phone, gc.email, gc.title, gc.company_name, gc.owner_note, gc.owner_label, gc.source, crypto.randomUUID(), occurredAt]);
  }

  await client.end();
  console.log('Database successfully seeded with demo dataset!');
}

main().catch(console.error);
