const { Client } = require('pg');
const crypto = require('crypto');

const ceoAssocId = 'c1983000-0000-4000-8000-000000001983';

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();
  console.log('Connected to vione_app PostgreSQL database.');

  const usersRes = await client.query(`SELECT id, email FROM public.vione_users LIMIT 5`);
  const firstUserId = usersRes.rows[0]?.id;

  if (firstUserId) {
    console.log('Seeding Opportunities for CEO1983 with poster_id:', firstUserId);
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
          id, association_id, poster_id, title, type, description, deadline, status, created_at, updated_at
        ) VALUES (
          $1::uuid, $2::uuid, $3::uuid, $4, $5, $6, NOW() + INTERVAL '30 days', 'active', now(), now()
        )
        ON CONFLICT DO NOTHING
      `, [opId, ceoAssocId, firstUserId, op.title, op.type, op.description]);
    }
  }

  console.log('✅ SEED OPPORTUNITIES COMPLETED SUCCESSFULLY!');
  await client.end();
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
