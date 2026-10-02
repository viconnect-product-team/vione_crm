const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&sslmode=disable',
  connectionTimeoutMillis: 5000,
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL database for enterprise migration...');

  const ownerId = 'a0000000-0000-4000-8000-000000000002';

  // 1. Seed Multi-Tenant Companies
  const companiesCount = await client.query('SELECT COUNT(*) as count FROM public.companies;');
  if (parseInt(companiesCount.rows[0].count, 10) === 0) {
    console.log('Seeding enterprise companies...');
    const companies = [
      {
        id: 'c1000000-0000-4000-8000-000000000001',
        owner_user_id: ownerId,
        name: 'Công Ty Cổ Phần Công Nghệ & Giải Pháp ViOne',
        slug: 'vione-technology-solutions',
        industry: 'Công Nghệ Thông Tin & Phần Mềm',
        size: '50 - 200 nhân sự',
        country: 'Việt Nam',
        city: 'Hà Nội',
        website: 'https://vione.vn',
        email: 'contact@vione.vn',
        phone: '1900 6868',
        description: 'Tổ hợp công nghệ cung cấp Nền tảng Hệ điều hành doanh nghiệp ViOne Platform 5.0, giải pháp CRM hợp nhất, thẻ Titanium NFC 1-chạm và AI Copilot.',
        verified: true,
        visibility: 'public',
        status: 'active'
      },
      {
        id: 'c1000000-0000-4000-8000-000000000002',
        owner_user_id: ownerId,
        name: 'Tập Đoàn Bất Động Sản & Xây Dựng An Phát',
        slug: 'an-phat-holdings',
        industry: 'Bất Động Sản & Xây Dựng',
        size: '200 - 500 nhân sự',
        country: 'Việt Nam',
        city: 'Hà Nội',
        website: 'https://anphatholdings.vn',
        email: 'b2b@anphat.vn',
        phone: '024 3888 9999',
        description: 'Chủ đầu tư các cụm khu công nghiệp xanh và chuỗi đô thị thông minh chuẩn LEED toàn quốc.',
        verified: true,
        visibility: 'public',
        status: 'active'
      },
      {
        id: 'c1000000-0000-4000-8000-000000000003',
        owner_user_id: ownerId,
        name: 'Công Ty TNHH F-Solutions Công Nghệ Đám Mây',
        slug: 'f-solutions-cloud',
        industry: 'Dịch Vụ Đám Mây & AI',
        size: '15 - 50 nhân sự',
        country: 'Việt Nam',
        city: 'TP. Hồ Chí Minh',
        website: 'https://fsolutions.vn',
        email: 'info@fsolutions.vn',
        phone: '028 7300 6868',
        description: 'Đơn vị cung cấp hạ tầng Cloud Server, DevOps và tích hợp AI cho khối doanh nghiệp tài chính ngân hàng.',
        verified: true,
        visibility: 'public',
        status: 'active'
      },
      {
        id: 'c1000000-0000-4000-8000-000000000004',
        owner_user_id: ownerId,
        name: 'Quỹ Đầu Tư & Quản Lý Tài Sản V-Capital',
        slug: 'v-capital-funds',
        industry: 'Tài Chính & Quỹ Đầu Tư',
        size: '15 - 50 nhân sự',
        country: 'Việt Nam',
        city: 'Hà Nội',
        website: 'https://vcapital.vn',
        email: 'investment@vcapital.vn',
        phone: '024 3999 5555',
        description: 'Quỹ đầu tư mạo hiểm và tăng trưởng chuyên rót vốn cho các startup công nghệ B2B tại Đông Nam Á.',
        verified: true,
        visibility: 'public',
        status: 'active'
      },
      {
        id: 'c1000000-0000-4000-8000-000000000005',
        owner_user_id: ownerId,
        name: 'Chuỗi Bán Lẻ & Logistics Toàn Quốc V-Logistics',
        slug: 'v-logistics-supply-chain',
        industry: 'Vận Tải & Chuỗi Cung Ứng',
        size: '500+ nhân sự',
        country: 'Việt Nam',
        city: 'Bình Dương',
        website: 'https://vlogistics.vn',
        email: 'supply@vlogistics.vn',
        phone: '0274 388 7777',
        description: 'Hệ thống kho vận thông minh và vận chuyển phân phối hàng hóa tiêu chuẩn quốc tế.',
        verified: true,
        visibility: 'public',
        status: 'active'
      }
    ];

    for (const c of companies) {
      await client.query(`
        INSERT INTO public.companies (id, owner_user_id, name, slug, industry, size, country, city, website, email, phone, description, verified, visibility, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now(), now())
        ON CONFLICT (id) DO NOTHING;
      `, [c.id, c.owner_user_id, c.name, c.slug, c.industry, c.size, c.country, c.city, c.website, c.email, c.phone, c.description, c.verified, c.visibility, c.status]);
    }
    console.log('✓ Seeded 5 enterprise companies successfully.');
  }

  // 2. Clean and standardize notifications (eliminate CEO 1983 / Hội viên)
  console.log('Standardizing notifications to ViOne Enterprise...');
  await client.query(`
    UPDATE public.business_notifications
    SET title_key = 'Kích hoạt Thành viên Doanh nghiệp ViOne Platform 5.0',
        body_key = 'Chúc mừng Quý Doanh nghiệp đã chính thức kích hoạt Hệ điều hành ViOne Platform 5.0. Toàn bộ phân hệ Quản trị CRM, Quy trình BPMN, Phê duyệt chi 3 cấp và Danh thiếp Titanium NFC 1-chạm đã sẵn sàng!'
    WHERE title_key LIKE '%CEO 1983%' OR title_key LIKE '%Hội viên%' OR body_key LIKE '%CEO 1983%';
  `);

  // 3. Clean and standardize messages
  console.log('Standardizing messages to ViOne Enterprise...');
  await client.query(`
    UPDATE public.messages
    SET text = 'Kênh Ban Điều Hành & Trợ lý AI ViOne Platform 5.0: Chúc Quý Doanh nghiệp một ngày làm việc hiệu quả và bứt phá doanh số.'
    WHERE text LIKE '%CEO 1983%' OR text LIKE '%CLB%';
  `);

  // 4. Standardize members terminology: remove "Hội viên" in executive_role, type, etc.
  console.log('Standardizing members terminology...');
  await client.query(`
    UPDATE public.members
    SET executive_role = 'Thành viên Doanh nghiệp C-Level'
    WHERE executive_role IS NULL OR executive_role LIKE '%Hội viên%';
  `);

  console.log('✓ All database terminology migrated 100% to ViOne Enterprise standard!');
  await client.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
