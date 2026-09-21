const { Client } = require('pg');
const crypto = require('crypto');

const ceoAssocId = 'c1983000-0000-4000-8000-000000001983';

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();
  console.log('Connected to vione_app PostgreSQL database.');

  // 1. Ensure CEO1983 Association
  console.log('Updating CEO1983 Association info...');
  await client.query(`
    INSERT INTO public.associations (
      id, name, slug, logo_url, brand_primary, tagline, about, contact_email, landing_published, public_card_enabled, created_at, updated_at
    ) VALUES (
      $1::uuid,
      'CLB Doanh Nhân CEO 1983',
      'ceo1983',
      'https://ceo1983.com/wp-content/uploads/2023/10/logo-ceo-1983.png',
      '#0284C7',
      'Kết nối đồng niên - Nâng tầm giá trị',
      'CLB CEO 1983 trực thuộc Hội Doanh nghiệp Trẻ Hà Nội (HanoiBA), là cộng đồng hội tụ các chủ doanh nghiệp sinh năm 1983 (Quý Hợi) cùng kết nối giao thương, chia sẻ kinh nghiệm quản trị và thúc đẩy kinh doanh bền vững.',
      'clbceo1983@gmail.com',
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
  `, [ceoAssocId]);

  const usersRes = await client.query(`SELECT id, email FROM public.vione_users`);
  const firstUserId = usersRes.rows[0]?.id || 'u0000000-0000-4000-8000-000000000001';

  // 2. Seed Products for CEO1983
  console.log('Seeding Products for CEO1983...');
  const products = [
    {
      id: 'prod-ceo1983-001',
      title: 'Vật Liệu Xây Dựng & Thép Kết Cấu Tiêu Chuẩn Cao',
      price: 18500000,
      category: 'Xây dựng & Bất động sản',
      description: 'Cung cấp thép cuộn, thép cây và phụ kiện xây dựng cho các công trình trọng điểm miền Bắc.',
      emoji: '🏗️'
    },
    {
      id: 'prod-ceo1983-002',
      title: 'Phần Mềm Quản Trị Khách Sạn & Nhà Hàng Cloud POS',
      price: 12000000,
      category: 'Công nghệ & Phần mềm',
      description: 'Hệ thống gọi món, quản lý bàn, đối soát doanh thu tự động và tích hợp hóa đơn điện tử.',
      emoji: '💻'
    },
    {
      id: 'prod-ceo1983-003',
      title: 'Hộp Yến Sào Hoàng Gia Thượng Hạng CEO 1983',
      price: 3200000,
      category: 'Quà tặng & Sức khỏe',
      description: 'Yến sào nguyên tổ đảo Phú Quốc, chưng sẵn đông trùng hạ thảo và táo đỏ hữu cơ.',
      emoji: '🪺'
    }
  ];

  for (const pr of products) {
    await client.query(`
      INSERT INTO public.products (
        id, association_id, seller_id, title, price, category, description, emoji, status, views, created_at, updated_at
      ) VALUES (
        $1, $2::uuid, $3, $4, $5, $6, $7, $8, 'active', 190, now(), now()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        updated_at = now()
    `, [pr.id, ceoAssocId, firstUserId, pr.title, pr.price, pr.category, pr.description, pr.emoji]);
  }

  // 3. Seed News for CEO1983
  console.log('Seeding News for CEO1983...');
  const newsList = [
    {
      code: 'NEWS-CEO1983-01',
      title: 'Lễ Kỷ Niệm 3 Năm Thành Lập CLB Doanh Nhân CEO 1983',
      category: 'Sự kiện',
      author: 'Ban Truyền Thông',
      published_at: '2026-09-02',
      views: 410,
      excerpt: 'Đêm Gala Dinner kỷ niệm 3 năm gắn kết tình bằng hữu và thúc đẩy giao thương các thành viên Quý Hợi 1983.'
    },
    {
      code: 'NEWS-CEO1983-02',
      title: 'Tổng Kết Chương Trình Caravan Thiện Nguyện "Áo Ấm Vùng Cao 2026"',
      category: 'Thiện nguyện',
      author: 'Ban Xã Hội',
      published_at: '2026-08-20',
      views: 290,
      excerpt: 'Chuyến xe thiện nguyện trao tặng 500 suất quà và xây dựng 2 phòng học tại Hà Giang.'
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
    `, [ceoAssocId, n.code, n.title, n.category, n.author, n.published_at, n.views, n.excerpt]);
  }

  // 4. Seed Documents for CEO1983
  console.log('Seeding Documents for CEO1983...');
  const docList = [
    {
      code: 'DOC-CEO1983-01',
      name: 'Quy Chế Hoạt Động & Chuẩn Mực Ứng Xử CLB CEO 1983',
      category: 'Quy chế',
      size: '1.9 MB',
      type: 'pdf'
    },
    {
      code: 'DOC-CEO1983-02',
      name: 'Danh Bạ & Hồ Sơ Năng Lực Doanh Nghiệp Hội Viên 2026',
      category: 'Danh bạ',
      size: '8.5 MB',
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
    `, [ceoAssocId, d.code, d.name, d.category, d.size, d.type]);
  }

  // 5. Seed Association Benefits for CEO1983
  console.log('Seeding Benefits for CEO1983...');
  const benefits = [
    {
      title_vi: 'Giao thương đồng niên 1983',
      title_en: '1983 Peer Trade & Network',
      desc_vi: 'Môi trường tin cậy kết nối cùng thế hệ doanh nhân Quý Hợi',
      desc_en: 'Trusted networking among 1983 entrepreneurs',
      sort_order: 1
    },
    {
      title_vi: 'Tọa đàm quản trị & chia sẻ chuyên đề',
      title_en: 'Management Workshops',
      desc_vi: 'Gặp gỡ các chuyên gia kinh tế và cố vấn chiến lược hàng đầu',
      desc_en: 'Meet top business mentors and strategic advisors',
      sort_order: 2
    },
    {
      title_vi: 'Danh thiếp số ViOne Pass',
      title_en: 'ViOne Digital Card',
      desc_vi: 'Thẻ hội viên VIP tích hợp mã định danh số và NFC',
      desc_en: 'VIP Member pass with QR code and NFC integration',
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
    `, [ceoAssocId, b.title_vi, b.title_en, b.desc_vi, b.desc_en, b.sort_order]);
  }

  console.log('✅ ALL CEO1983 DATA SEEDED PERFECTLY!');
  await client.end();
}

main().catch(console.error);
