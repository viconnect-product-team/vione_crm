const { Client } = require('pg');
const crypto = require('crypto');

const hanoibaAssocId = 'ba000000-0000-4000-8000-000000000001';

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();
  console.log('Connected to vione_app PostgreSQL database.');

  // 1. Insert or Update HanoiBA Association
  console.log('Creating / Updating HanoiBA Association...');
  await client.query(`
    INSERT INTO public.associations (
      id, name, slug, logo_url, brand_primary, tagline, about, contact_email, landing_published, public_card_enabled, created_at, updated_at
    ) VALUES (
      $1::uuid,
      'Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA)',
      'hanoiba',
      'https://api.dicebear.com/7.x/identicon/svg?seed=HANOIBA_VIP',
      '#E11D48',
      'Gắn kết doanh nhân - Tiên phong đổi mới - Nâng tầm giá trị Thủ đô',
      'Hội Doanh nghiệp Trẻ Hà Nội (HanoiBA) trực thuộc Hội LHTN Việt Nam TP. Hà Nội, là tổ chức đại diện cho tiếng nói và sức mạnh của cộng đồng doanh nhân trẻ Thủ đô. HanoiBA quy tụ gần 1.000 doanh nghiệp hàng đầu, tiên phong trong đổi mới sáng tạo, chuyển đổi số và phát triển bền vững.',
      'vanphong@hanoiba.org.vn',
      true,
      true,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      logo_url = EXCLUDED.logo_url,
      brand_primary = EXCLUDED.brand_primary,
      tagline = EXCLUDED.tagline,
      about = EXCLUDED.about,
      contact_email = EXCLUDED.contact_email,
      landing_published = true,
      public_card_enabled = true,
      updated_at = now()
  `, [hanoibaAssocId]);

  // 2. Add memberships for users to HanoiBA
  console.log('Linking users to HanoiBA association...');
  const usersRes = await client.query(`SELECT id, email FROM public.vione_users`);
  const firstUserId = usersRes.rows[0]?.id || 'u0000000-0000-4000-8000-000000000001';

  for (const u of usersRes.rows) {
    await client.query(`
      INSERT INTO auth.users (id, email, role)
      VALUES ($1::uuid, $2, 'authenticated')
      ON CONFLICT (id) DO NOTHING
    `, [u.id, u.email]);

    await client.query(`
      INSERT INTO public.memberships (id, user_id, association_id, role, is_default, created_at, updated_at)
      VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'admin', false, now(), now())
      ON CONFLICT DO NOTHING
    `, [u.id, hanoibaAssocId]);
  }

  // 3. Seed Members for HanoiBA
  console.log('Seeding members for HanoiBA...');
  const hanoibaMembers = [
    { name: 'Trần Đăng Khoa', company: 'Khoa Vàng Tech Group', title: 'Chủ tịch HĐQT', industry: 'Công nghệ thông tin', email: 'khoa.tran@khoavang.vn', phone: '0903888001', role: 'Chủ tịch Hội' },
    { name: 'Lê Minh Hưng', company: 'Hưng Thịnh Real Estate', title: 'Phó Chủ tịch', industry: 'Bất động sản & Xây dựng', email: 'hung.le@hungthinhland.vn', phone: '0903888002', role: 'Phó Chủ tịch' },
    { name: 'Nguyễn Thị Bích Ngọc', company: 'Bích Ngọc Global Trade', title: 'Phó Chủ tịch kiêm Tổng Thư ký', industry: 'Xuất nhập khẩu & Thương mại', email: 'ngoc.nguyen@bichngoctrade.com', phone: '0903888003', role: 'Tổng Thư ký' },
    { name: 'Phạm Hải Đăng', company: 'Đăng Quang Logistics', title: 'Ủy viên Ban Chấp Hành', industry: 'Vận tải & Logistics', email: 'dang.pham@dangquanglog.vn', phone: '0903888004', role: 'Trưởng ban Xúc tiến TM' },
    { name: 'Hoàng Quốc Việt', company: 'Việt An Eco Food', title: 'Giám đốc Điều hành', industry: 'Nông nghiệp & Thực phẩm', email: 'viet.hoang@vietanfood.vn', phone: '0903888005', role: 'Ủy viên BCH' },
    { name: 'Đỗ Thùy Linh', company: 'Linh Trang Fashion & Retail', title: 'Founder & CEO', industry: 'Bán lẻ & Thời trang', email: 'linh.do@linhtrangfashion.vn', phone: '0903888006', role: 'Ủy viên BCH' },
    { name: 'Vũ Quốc Khánh', company: 'Khánh Gia Energy', title: 'Chủ tịch HĐQT', industry: 'Năng lượng tái tạo', email: 'khanh.vu@khanhgiaenergy.vn', phone: '0903888007', role: 'Hội viên VIP' },
    { name: 'Ngô Thanh Tùng', company: 'Tùng Lâm Media', title: 'Giám đốc Truyền thông', industry: 'Truyền thông & Marketing', email: 'tung.ngo@tunglammedia.vn', phone: '0903888008', role: 'Hội viên VIP' }
  ];

  for (let i = 0; i < hanoibaMembers.length; i++) {
    const m = hanoibaMembers[i];
    const memberId = crypto.randomUUID();
    const code = `HANOIBA-${String(i + 1).padStart(4, '0')}`;

    await client.query(`
      INSERT INTO public.members (
        id, code, name, contact, email, phone, type, level, industry, region, status,
        joined_at, fee_year, fee_paid, address, about, reminder_count,
        created_at, updated_at, association_id, payment_status
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, 'Doanh nghiệp', 'VIP Diamond', $7, 'Hà Nội', 'active',
        CURRENT_DATE, 2026, true, 'Hà Nội, Việt Nam', $8, 0,
        now(), now(), $9::uuid, 'paid'
      )
      ON CONFLICT DO NOTHING
    `, [memberId, code, m.name, `${m.title} - ${m.company}`, m.email, m.phone, m.industry, `${m.role} - ${m.title} tại ${m.company}`, hanoibaAssocId]);
  }

  // 4. Seed Events for HanoiBA
  console.log('Seeding Events for HanoiBA...');
  const events = [
    {
      id: `EV-HANOIBA-001`,
      name: 'Diễn Đàn Doanh Nghiệp Trẻ Thủ Đô 2026: Đột Phá Công Nghệ & Chuyển Đổi Xanh',
      date: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      location: 'Trung tâm Hội nghị Quốc gia, Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội',
      capacity: 500,
      registered: 180,
      status: 'upcoming',
      type: 'forum'
    },
    {
      id: `EV-HANOIBA-002`,
      name: 'Đại Hội Hội Doanh Nghiệp Trẻ Hà Nội Khóa IX (Nhiệm kỳ 2026 - 2030)',
      date: new Date(Date.now() + 18 * 24 * 3600 * 1000),
      location: 'Khách sạn Melia Hà Nội, 44 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
      capacity: 600,
      registered: 350,
      status: 'upcoming',
      type: 'gala'
    },
    {
      id: `EV-HANOIBA-003`,
      name: 'Giải Golf HanoiBA Open 2026 & Kết Nối Giao Thương B2B',
      date: new Date(Date.now() + 25 * 24 * 3600 * 1000),
      location: 'BRG Kings Island Golf Resort, Đồng Mô, Sơn Tây, Hà Nội',
      capacity: 144,
      registered: 110,
      status: 'upcoming',
      type: 'sports'
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
    `, [e.id, e.name, e.date, e.location, e.capacity, e.registered, e.status, e.type, hanoibaAssocId]);
  }

  // 5. Seed Opportunities (B2B Matching) for HanoiBA
  console.log('Seeding Opportunities for HanoiBA...');
  const opps = [
    {
      id: 'opp-hanoiba-001',
      title: 'Tìm đối tác phát triển nền tảng AI ERP & CRM tự động hóa cho chuỗi bán lẻ',
      type: 'buy',
      description: 'Khoa Vàng Tech Group cần hợp tác với các đơn vị phát triển mô hình AI và triển khai ERP tích hợp dữ liệu bán lẻ.',
      budget_min: 500000000,
      budget_max: 2000000000,
      industry: 'Công nghệ thông tin',
      region: 'Hà Nội'
    },
    {
      id: 'opp-hanoiba-002',
      title: 'Cung cấp giải pháp kho vận thông minh và trung tâm logistics ngoại thành Hà Nội',
      type: 'sell',
      description: 'Đăng Quang Logistics cung ứng hệ thống kho bãi tiêu chuẩn ISO 22000 diện tích 15.000m2 tại KCN Quang Minh.',
      budget_min: 100000000,
      budget_max: 500000000,
      industry: 'Vận tải & Logistics',
      region: 'Hà Nội'
    },
    {
      id: 'opp-hanoiba-003',
      title: 'Mời hợp tác phân phối nông sản hữu cơ xuất khẩu sang thị trường EU & Nhật Bản',
      type: 'cooperation',
      description: 'Việt An Eco Food tìm kiếm các chuỗi siêu thị, nhà phân phối nội địa và đối tác xúc tiến xuất khẩu nông sản sạch.',
      budget_min: 300000000,
      budget_max: 1500000000,
      industry: 'Nông nghiệp & Thực phẩm',
      region: 'Toàn quốc'
    }
  ];

  for (const op of opps) {
    await client.query(`
      INSERT INTO public.opportunities (
        id, association_id, poster_id, title, type, description, budget_min, budget_max, industry, region, deadline, status, views, created_at, updated_at
      ) VALUES (
        $1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL '30 days', 'active', 128, now(), now()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        budget_min = EXCLUDED.budget_min,
        budget_max = EXCLUDED.budget_max,
        updated_at = now()
    `, [op.id, hanoibaAssocId, firstUserId, op.title, op.type, op.description, op.budget_min, op.budget_max, op.industry, op.region]);
  }

  // 6. Seed Products for HanoiBA
  console.log('Seeding Products for HanoiBA...');
  const products = [
    {
      id: 'prod-hanoiba-001',
      title: 'Gói Chuyển Đổi Số Doanh Nghiệp ViOne Enterprise AI',
      price: 45000000,
      category: 'Công nghệ & Phần mềm',
      description: 'Giải pháp tổng thể quản trị hội viên, danh thiếp số thông minh, tự động hóa hội phí và báo cáo tài chính.',
      emoji: '🚀'
    },
    {
      id: 'prod-hanoiba-002',
      title: 'Dịch Vụ Kho Vận & Phân Phối Hàng Hóa Nhanh 24/7',
      price: 15000000,
      category: 'Vận tải & Logistics',
      description: 'Đội xe vận tải 50 xe tải từ 1.5 đến 15 tấn, giao hàng nội thành Hà Nội và các tỉnh phía Bắc trong 24 giờ.',
      emoji: '🚚'
    },
    {
      id: 'prod-hanoiba-003',
      title: 'Hộp Quà Tặng Nông Sản Hữu Cơ Cao Cấp HanoiBA Gift Set',
      price: 1250000,
      category: 'Quà tặng & Tiêu dùng',
      description: 'Set quà thượng hạng gồm trà Shan Tuyết cổ thụ, mật ong hoa rừng nguyên chất và hạt điều rang củi đạt chuẩn OCOP 5 sao.',
      emoji: '🎁'
    }
  ];

  for (const pr of products) {
    await client.query(`
      INSERT INTO public.products (
        id, association_id, seller_id, title, price, category, description, emoji, status, views, created_at, updated_at
      ) VALUES (
        $1, $2::uuid, $3, $4, $5, $6, $7, $8, 'active', 240, now(), now()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        updated_at = now()
    `, [pr.id, hanoibaAssocId, firstUserId, pr.title, pr.price, pr.category, pr.description, pr.emoji]);
  }

  // 7. Seed News for HanoiBA
  console.log('Seeding News for HanoiBA...');
  const newsList = [
    {
      code: 'NEWS-HANOIBA-01',
      title: 'Phát Động Chương Trình Bình Chọn Doanh Nhân Trẻ Thăng Long 2026',
      category: 'Thông báo',
      author: 'Ban Thư Ký HanoiBA',
      published_at: '2026-09-01',
      views: 350,
      excerpt: 'HanoiBA trân trọng thông báo tiếp nhận hồ sơ xét duyệt giải thưởng Doanh nhân trẻ tiêu biểu Thăng Long 2026.'
    },
    {
      code: 'NEWS-HANOIBA-02',
      title: 'Đoàn Doanh Nhân Trẻ Hà Nội Tham Dự Diễn Đàn Xúc Tiến Thương Mại ASEAN 2026',
      category: 'Sự kiện',
      author: 'Ban Xúc Tiến Thương Mại',
      published_at: '2026-08-28',
      views: 520,
      excerpt: 'Đoàn công tác HanoiBA ký kết hơn 12 biên bản ghi nhớ hợp tác kinh tế tại Singapore và Malaysia.'
    }
  ];

  for (const n of newsList) {
    await client.query(`
      INSERT INTO public.news (
        id, association_id, code, title, category, author, published_at, views, status, excerpt, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2, $3, $4, $5, $6, $7, 'published', $8, now(), now()
      )
      ON CONFLICT DO NOTHING
    `, [hanoibaAssocId, n.code, n.title, n.category, n.author, n.published_at, n.views, n.excerpt]);
  }

  // 8. Seed Documents for HanoiBA
  console.log('Seeding Documents for HanoiBA...');
  const docList = [
    {
      code: 'DOC-HANOIBA-01',
      name: 'Điều Lệ & Quy Chế Hoạt Động Hội Doanh Nghiệp Trẻ Hà Nội',
      category: 'Điều lệ & Quy chế',
      size: '2.4 MB',
      type: 'pdf'
    },
    {
      code: 'DOC-HANOIBA-02',
      name: 'Báo Cáo Hoạt Động & Tài Chính 6 Tháng Đầu Năm 2026',
      category: 'Báo cáo',
      size: '4.8 MB',
      type: 'pdf'
    }
  ];

  for (const d of docList) {
    await client.query(`
      INSERT INTO public.documents (
        id, association_id, code, name, category, size, uploaded_at, uploaded_by, type, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2, $3, $4, $5, CURRENT_DATE, 'Ban Thư Ký', $6, now(), now()
      )
      ON CONFLICT DO NOTHING
    `, [hanoibaAssocId, d.code, d.name, d.category, d.size, d.type]);
  }

  // 9. Seed Association Benefits
  console.log('Seeding Benefits for HanoiBA...');
  const benefits = [
    {
      title_vi: 'Kết nối mạng lưới 1.000+ Doanh nghiệp',
      title_en: '1000+ Business Network',
      desc_vi: 'Giao thương và hợp tác trong hệ sinh thái doanh nhân Thủ đô',
      desc_en: 'Trade and collaborate across the Capital business ecosystem',
      sort_order: 1
    },
    {
      title_vi: 'Tham dự sự kiện & Diễn đàn VIP',
      title_en: 'VIP Events & Forums',
      desc_vi: 'Miễn phí và ưu tiên đăng ký các tọa đàm kinh tế cấp cao',
      desc_en: 'Free and priority registration for high-level summits',
      sort_order: 2
    },
    {
      title_vi: 'Danh thiếp số ViOne Smart ID',
      title_en: 'ViOne Smart Digital Pass',
      desc_vi: 'Định danh số có xác thực QR & NFC tích hợp Apple/Google Wallet',
      desc_en: 'Verified digital ID with QR & NFC, Apple/Google Wallet ready',
      sort_order: 3
    }
  ];

  for (const b of benefits) {
    await client.query(`
      INSERT INTO public.association_benefits (
        id, association_id, title_vi, title_en, desc_vi, desc_en, sort_order, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2, $3, $4, $5, $6, now(), now()
      )
      ON CONFLICT DO NOTHING
    `, [hanoibaAssocId, b.title_vi, b.title_en, b.desc_vi, b.desc_en, b.sort_order]);
  }

  console.log('✅ ALL HANOIBA DATA (Association, Members, Events, Opportunities, Products, News, Docs, Benefits) SEEDED PERFECTLY!');
  await client.end();
}

main().catch(console.error);
