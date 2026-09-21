const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public'
});

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL database...');

  const associationId = 'c1983000-0000-4000-8000-000000001983';
  const eventId = 'EVT-1983-GALA-2026';

  // 1. Lấy danh sách 10 thành viên đầu tiên của hiệp hội CEO 1983
  const membersRes = await client.query(`
    SELECT id, code, name, email, phone 
    FROM public.members 
    WHERE association_id = $1::uuid
    ORDER BY code ASC 
    LIMIT 10
  `, [associationId]);

  const members = membersRes.rows;
  console.log(`Found ${members.length} members for seeding registrations.`);

  // 2. Xóa các đăng ký cũ của sự kiện nếu có
  await client.query(`DELETE FROM public.event_registrations WHERE event_id = $1`, [eventId]);

  // 3. Seed 10 registrations
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const regId = `REG-1983-${String(i + 1).padStart(3, '0')}`;
    const isVip = i < 5;
    const ticketType = isVip ? 'VIP' : 'Tiêu chuẩn';
    const seat = isVip ? `Bàn VIP 01 - Ghế ${i + 1}` : `Bàn Giao Thương 02 - Ghế ${i - 4}`;
    const amount = isVip ? 2000000 : 1000000;
    const isCheckedIn = i < 4; // 4 người đã check-in
    const checkedInAt = isCheckedIn ? new Date().toISOString() : null;

    await client.query(`
      INSERT INTO public.event_registrations (
        id, event_id, member_code, member_name, email,
        registered_at, status, ticket_type, association_id,
        payment_status, payment_method, payment_amount,
        seat_assignment, qr_payload, checked_in_at,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        CURRENT_DATE - INTERVAL '${10 - i} days', 'confirmed', $6, $7::uuid,
        'paid', 'bank_transfer', $8,
        $9, $10, $11,
        NOW(), NOW()
      )
    `, [
      regId, eventId, m.code, m.name, m.email,
      ticketType, associationId, amount,
      seat, `VIONE-QR-${regId}`, checkedInAt
    ]);
  }
  console.log(`Successfully inserted ${members.length} event registrations for ${eventId}.`);

  // Đảm bảo số lượng registered trong bảng events là 10
  await client.query(`
    UPDATE public.events 
    SET registered = 10, capacity = 200 
    WHERE id = $1
  `, [eventId]);

  // 4. Seed 4 hóa đơn hội phí vào bảng public.invoices
  // Xóa hóa đơn cũ nếu có
  await client.query(`DELETE FROM public.invoices WHERE association_id = $1::uuid`, [associationId]);

  const invoiceSeeds = [
    {
      id: 'INV-2026-001',
      member_id: members[6]?.id || members[0].id,
      invoice_no: 'HD-2026-001',
      year: 2026,
      amount: 20000000,
      due_date: '2026-03-31',
      paid_at: null,
      status: 'unpaid',
      method: null,
    },
    {
      id: 'INV-2026-002',
      member_id: members[7]?.id || members[1].id,
      invoice_no: 'HD-2026-002',
      year: 2026,
      amount: 15000000,
      due_date: '2026-04-15',
      paid_at: null,
      status: 'unpaid',
      method: null,
    },
    {
      id: 'INV-2026-003',
      member_id: members[8]?.id || members[2].id,
      invoice_no: 'HD-2026-003',
      year: 2026,
      amount: 25000000,
      due_date: '2026-02-28',
      paid_at: null,
      status: 'overdue',
      method: null,
    },
    {
      id: 'INV-2026-004',
      member_id: members[9]?.id || members[3].id,
      invoice_no: 'HD-2026-004',
      year: 2026,
      amount: 10000000,
      due_date: '2026-03-01',
      paid_at: '2026-03-05',
      status: 'paid',
      method: 'bank',
    },
  ];

  for (const inv of invoiceSeeds) {
    await client.query(`
      INSERT INTO public.invoices (
        id, member_id, invoice_no, year, amount,
        due_date, paid_at, status, method,
        association_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6::date, $7::date, $8, $9,
        $10::uuid, NOW(), NOW()
      )
    `, [
      inv.id, inv.member_id, inv.invoice_no, inv.year, inv.amount,
      inv.due_date, inv.paid_at, inv.status, inv.method,
      associationId
    ]);
  }
  console.log(`Successfully inserted 4 fee invoices into public.invoices.`);

  // Kiểm tra lại
  const checkRegs = await client.query(`SELECT count(*) FROM public.event_registrations WHERE event_id = $1`, [eventId]);
  const checkInvs = await client.query(`SELECT count(*) FROM public.invoices WHERE association_id = $1::uuid`, [associationId]);
  console.log(`Verification: Event registrations count = ${checkRegs.rows[0].count}, Invoices count = ${checkInvs.rows[0].count}`);

  await client.end();
}

run().catch((err) => {
  console.error('Error seeding data:', err);
  process.exit(1);
});
