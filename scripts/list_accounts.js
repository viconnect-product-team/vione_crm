const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const c = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable' });

async function run() {
  await c.connect();

  const users = await c.query(`
    SELECT u.id, u.email, u.name, u.created_at,
           m.code as member_code, m.name as company_name, m.contact as contact_person,
           m.phone, m.status as member_status, m.executive_role, m.department
    FROM public.vione_users u
    LEFT JOIN public.members m ON m.user_id = u.id OR m.email = u.email
    ORDER BY u.created_at DESC
  `);

  const allMembers = await c.query(`
    SELECT id, code, name, contact, email, phone, status, executive_role, department, fee_paid, type, level
    FROM public.members
    ORDER BY code ASC
  `);

  console.log(`Tìm thấy ${users.rows.length} người dùng vione_users và ${allMembers.rows.length} thành viên members.`);

  fs.writeFileSync(
    path.join(__dirname, 'accounts_dump.json'),
    JSON.stringify({ users: users.rows, members: allMembers.rows }, null, 2),
    'utf-8'
  );

  console.log('Đã lưu dữ liệu ra scripts/accounts_dump.json');
  await c.end();
}

run().catch(console.error);
