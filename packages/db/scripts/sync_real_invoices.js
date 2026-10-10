const { Client } = require('pg');

const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  const mems = await client.query('SELECT id, name, joined_at FROM public.members ORDER BY joined_at ASC;');
  console.log(`Found ${mems.rows.length} members`);

  await client.query('DELETE FROM public.invoices;');
  console.log('Cleared invoices table.');

  // Create 25 paid invoices and 4 unpaid invoices
  let invIdx = 1;
  for (let i = 0; i < mems.rows.length; i++) {
    const mem = mems.rows[i];
    const isUnpaid = i >= 25 && i < 29; // 4 unpaid invoices
    if (i >= 29) continue; // 25 paid + 4 unpaid = 29 invoices

    const status = isUnpaid ? 'unpaid' : 'paid';
    const amount = (15 + (i % 5) * 2) * 1000000; // 15m to 23m VND
    const invNo = `INV-2026-${String(invIdx).padStart(4, '0')}`;
    const dueDate = '2026-10-31';
    const paidAt = isUnpaid ? null : (mem.joined_at ? new Date(mem.joined_at).toISOString().slice(0, 10) : '2026-08-15');
    const method = isUnpaid ? null : 'bank';
    const createdAt = mem.joined_at ? new Date(mem.joined_at).toISOString() : new Date().toISOString();

    await client.query(`
      INSERT INTO public.invoices (id, member_id, invoice_no, year, amount, due_date, paid_at, status, method, created_at, updated_at)
      VALUES ($1, $2, $3, 2026, $4, $5, $6, $7, $8, $9, now());
    `, [
      `INV-ID-${invIdx}`,
      mem.id,
      invNo,
      amount,
      dueDate,
      paidAt,
      status,
      method,
      createdAt
    ]);

    invIdx++;
  }

  const check = await client.query('SELECT status, COUNT(*), SUM(amount) FROM public.invoices GROUP BY status;');
  console.log('Invoices created successfully:');
  console.table(check.rows);

  await client.end();
}

main().catch(console.error);
