const { Client } = require('pg');
const crypto = require('crypto');

const ceoAssocId = 'c1983000-0000-4000-8000-000000001983';

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();
  console.log('Connected to vione_app PostgreSQL database.');

  // 1. Insert or Update CEO1983 Association
  console.log('Creating / Updating CEO1983 Association...');
  await client.query(`
    INSERT INTO public.associations (
      id, name, slug, logo_url, brand_primary, tagline, about, contact_email, landing_published, public_card_enabled, created_at, updated_at
    ) VALUES (
      $1::uuid,
      'CLB Doanh Nhân CEO 1983',
      'ceo1983',
      'https://api.dicebear.com/7.x/identicon/svg?seed=CEO1983',
      '#E11D48',
      'Nơi hội tụ và kết nối sức mạnh của các nhà lãnh đạo, doanh nhân sinh năm 1983 (Quý Hợi)',
      'CLB Doanh nhân CEO 1983 là tổ chức kết nối giao thương, hợp tác kinh doanh, chia sẻ tri thức và đồng hành cùng phát triển bền vững cho cộng đồng các chủ doanh nghiệp sinh năm 1983 trên toàn quốc.',
      'banthuky@ceo1983.vn',
      true,
      true,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      tagline = EXCLUDED.tagline,
      about = EXCLUDED.about,
      contact_email = EXCLUDED.contact_email,
      landing_published = true,
      public_card_enabled = true,
      updated_at = now()
  `, [ceoAssocId]);

  // 2. Add memberships for all existing users to CEO1983
  console.log('Linking users to CEO1983 association...');
  const usersRes = await client.query(`SELECT id, email FROM public.vione_users`);
  for (const u of usersRes.rows) {
    await client.query(`
      INSERT INTO auth.users (id, email, role)
      VALUES ($1::uuid, $2, 'authenticated')
      ON CONFLICT (id) DO NOTHING
    `, [u.id, u.email]);

    await client.query(`
      INSERT INTO public.memberships (id, user_id, association_id, role, is_default, created_at, updated_at)
      VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'admin', true, now(), now())
      ON CONFLICT DO NOTHING
    `, [u.id, ceoAssocId]);
  }

  // 3. Seed Members for CEO1983
  console.log('Seeding members for CEO1983...');
  const memberList = [
    { name: 'Nguyễn Văn Hùng', company: 'Hùng Phát Corp', title: 'Chủ tịch HĐQT', industry: 'Sản xuất & Thương mại', email: 'hung.nguyen@hungphat.vn', phone: '0912341983' },
    { name: 'Trần Thị Mai Lan', company: 'Mai Lan Logistics', title: 'Tổng Giám Đốc', industry: 'Vận tải & Logistics', email: 'lan.tran@mailanlogistics.com', phone: '0983198301' },
    { name: 'Lê Hoàng Long', company: 'Long Tech Solutions', title: 'Giám đốc Công nghệ', industry: 'Công nghệ thông tin', email: 'long.le@longtech.vn', phone: '0903198302' },
    { name: 'Phạm Đức Minh', company: 'Minh Capital Investment', title: 'Managing Partner', industry: 'Đầu tư & Tài chính', email: 'minh.pham@minhcapital.vn', phone: '0973198303' },
    { name: 'Vũ Thu Trang', company: 'Trang Media & Events', title: 'Giám đốc Điều hành', industry: 'Truyền thông & Sự kiện', email: 'trang.vu@trangmedia.vn', phone: '0933198304' },
    { name: 'Đặng Quốc Bảo', company: 'Bảo Gia Construction', title: 'Chủ tịch HĐQT', industry: 'Xây dựng & Bất động sản', email: 'bao.dang@baogiaconstruct.vn', phone: '0943198305' },
    { name: 'Hoàng Hải Yến', company: 'Yến Ngọc Hospitality', title: 'Tổng Giám Đốc', industry: 'Du lịch & Nhà hàng', email: 'yen.hoang@yenngochospitality.vn', phone: '0963198306' },
    { name: 'Bùi Anh Tuấn', company: 'Tuấn Minh Pharma', title: 'Giám đốc Phân phối', industry: 'Dược phẩm & Y tế', email: 'tuan.bui@tuanminhpharma.vn', phone: '0923198307' }
  ];

  for (let i = 0; i < memberList.length; i++) {
    const m = memberList[i];
    const memberId = crypto.randomUUID();
    const code = `CEO1983-${String(i + 1).padStart(4, '0')}`;

    await client.query(`
      INSERT INTO public.members (
        id, code, name, contact, email, phone, type, level, industry, region, status,
        joined_at, fee_year, fee_paid, address, about, reminder_count,
        created_at, updated_at, association_id, payment_status
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, 'Doanh nghiệp', 'VIP Gold', $7, 'Hà Nội', 'active',
        CURRENT_DATE, 2026, true, 'Hà Nội, Việt Nam', $8, 0,
        now(), now(), $9::uuid, 'paid'
      )
      ON CONFLICT DO NOTHING
    `, [memberId, code, m.name, m.title + ' - ' + m.company, m.email, m.phone, m.industry, `${m.title} tại ${m.company}`, ceoAssocId]);
  }

  // 4. Seed Events for CEO1983 (Matching events schema: id text, name text, date Date, location text, capacity int, status text, type text)
  console.log('Seeding Events for CEO1983...');
  const events = [
    {
      id: `EV-CEO1983-001`,
      name: 'Đại hội Kết nối Giao thương CEO 1983 - Qúy III/2026',
      date: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      location: 'Khách sạn JW Marriott, Đỗ Đức Dục, Nam Từ Liêm, Hà Nội',
      capacity: 200,
      registered: 45,
      status: 'upcoming',
      type: 'forum'
    },
    {
      id: `EV-CEO1983-002`,
      name: 'Tọa đàm: Chiến lược Chuyển đổi số & Tối ưu Quản trị Doanh nghiệp 2026',
      date: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      location: 'Trung tâm Hội nghị Quốc tế Lotte, Liễu Giai, Ba Đình, Hà Nội',
      capacity: 150,
      registered: 80,
      status: 'upcoming',
      type: 'workshop'
    },
    {
      id: `EV-CEO1983-003`,
      name: 'Giải Golf Chào Mừng Kỷ Niệm Thành Lập CLB CEO 1983',
      date: new Date(Date.now() + 21 * 24 * 3600 * 1000),
      location: 'Sân Golf Long Biên, Phúc Đồng, Long Biên, Hà Nội',
      capacity: 120,
      registered: 65,
      status: 'upcoming',
      type: 'gala'
    }
  ];

  for (const e of events) {
    await client.query(`
      INSERT INTO public.events (
        id, name, date, location, capacity, registered, status, type, association_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::uuid, now(), now()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        date = EXCLUDED.date,
        location = EXCLUDED.location,
        capacity = EXCLUDED.capacity,
        registered = EXCLUDED.registered,
        status = EXCLUDED.status,
        type = EXCLUDED.type,
        updated_at = now()
    `, [e.id, e.name, e.date, e.location, e.capacity, e.registered, e.status, e.type, ceoAssocId]);
  }

  // 5. Seed Opportunities if table exists
  try {
    console.log('Seeding Opportunities for CEO1983...');
    const opps = [
      {
        title: 'Tìm đối tác cung ứng vật liệu xây dựng cho dự án nghỉ dưỡng tại Hòa Bình',
        type: 'business',
        description: 'Bảo Gia Construction cần tìm đối tác thành viên CEO 1983 cung cấp sắt thép, xi măng và thiết bị chiếu sáng tiêu chuẩn cao. (Ngân sách dự kiến: 5.000.000.000 VNĐ)'
      },
      {
        title: 'Hợp tác phát triển giải pháp ERP và CRM cho chuỗi 30 nhà hàng',
        type: 'investment',
        description: 'Yến Ngọc Hospitality tìm kiếm đối tác công nghệ trong CLB để triển khai hệ thống quản trị dữ liệu và thẻ thành viên số. (Ngân sách dự kiến: 800.000.000 VNĐ)'
      }
    ];

    for (const op of opps) {
      const opId = crypto.randomUUID();
      await client.query(`
        INSERT INTO public.opportunities (
          id, association_id, title, type, description, status, created_at, updated_at
        ) VALUES (
          $1::uuid, $2::uuid, $3, $4, $5, 'active', now(), now()
        )
        ON CONFLICT DO NOTHING
      `, [opId, ceoAssocId, op.title, op.type, op.description]);
    }
  } catch (err) {
    console.warn('Opportunities table note:', err.message);
  }

  console.log('✅ SEED CEO1983 COMPLETED SUCCESSFULLY!');
  await client.end();
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
