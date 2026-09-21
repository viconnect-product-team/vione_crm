const { Client } = require('pg');
const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function seedTwoEvents() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const assocId = 'c1983000-0000-4000-8000-000000001983';

  // 1. Free Event (0đ)
  await client.query(`
    INSERT INTO public.events (
      id, name, date, location, capacity, registered, status, type, fee, seating_plan, created_at, updated_at, association_id
    ) VALUES (
      'EVT-1983-FREE-01',
      'Tọa Đàm Kết Nối & Họp Mặt Ban Chấp Hành Quý 1',
      CURRENT_DATE + INTERVAL '5 days',
      'Trụ Sở Hiệp Hội Doanh Nhân CEO 1983 - Tòa Nhà HanoiBA',
      150, 18, 'published', 'forum', 0,
      '{"totalTables":2,"seatsPerTable":10,"tables":[{"id":"TB-01","name":"Bàn Ban Thường Vụ","category":"VIP","seats":10,"assigned":4},{"id":"TB-02","name":"Bàn Doanh Nhân Tiêu Biểu","category":"STANDARD","seats":10,"assigned":6}]}',
      now(), now(), $1
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      fee = 0,
      status = 'published',
      location = EXCLUDED.location;
  `, [assocId]);

  // 2. Paid Event (500,000 VNĐ)
  await client.query(`
    INSERT INTO public.events (
      id, name, date, location, capacity, registered, status, type, fee, seating_plan, created_at, updated_at, association_id
    ) VALUES (
      'EVT-1983-PAID-01',
      'Đại Hội Thường Niên CEO 1983 & Gala Dinner Doanh Nhân',
      CURRENT_DATE + INTERVAL '12 days',
      'Trung Tâm Hội Nghị Quốc Gia - Cổng 1 Đại Lộ Thăng Long, Hà Nội',
      300, 42, 'published', 'networking', 500000,
      '{"totalTables":4,"seatsPerTable":10,"tables":[{"id":"VIP-01","name":"Bàn VIP Ban Lãnh Đạo","category":"VIP","seats":10,"assigned":8},{"id":"VIP-02","name":"Bàn Khách Mời Danh Dự","category":"VIP","seats":10,"assigned":6},{"id":"TB-03","name":"Bàn Giao Thương B2B 01","category":"STANDARD","seats":10,"assigned":10},{"id":"TB-04","name":"Bàn Giao Thương B2B 02","category":"STANDARD","seats":10,"assigned":8}]}',
      now(), now(), $1
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      fee = 500000,
      status = 'published',
      location = EXCLUDED.location;
  `, [assocId]);

  console.log('✓ Successfully seeded Free Event (0đ) and Paid Event (500,000 VNĐ)!');
  await client.end();
}

seedTwoEvents().catch(console.error);
