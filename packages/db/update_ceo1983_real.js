const { Client } = require('pg');

const ceoAssocId = 'c1983000-0000-4000-8000-000000001983';

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();
  console.log('Connected to database.');

  await client.query(`
    UPDATE public.associations
    SET 
      name = 'CLB Doanh Nhân CEO 1983',
      slug = 'ceo1983',
      tagline = 'Kết nối đồng niên - Nâng tầm giá trị',
      about = 'CLB CEO 1983 trực thuộc Hội Doanh nghiệp Trẻ Hà Nội (HanoiBA), là cộng đồng hội tụ các chủ doanh nghiệp sinh năm 1983 (Quý Hợi) cùng kết nối giao thương, chia sẻ kinh nghiệm quản trị và thúc đẩy kinh doanh bền vững.',
      brand_primary = '#0284C7',
      contact_email = 'clbceo1983@gmail.com',
      logo_url = 'https://ceo1983.com/wp-content/uploads/2023/10/logo-ceo-1983.png',
      landing_published = true,
      public_card_enabled = true,
      updated_at = now()
    WHERE id = $1::uuid
  `, [ceoAssocId]);

  console.log('Updated CEO1983 details perfectly!');
  await client.end();
}

main().catch(console.error);
