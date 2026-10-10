const { Client } = require('pg');

const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  const res = await client.query('SELECT id, name FROM public.members ORDER BY name ASC;');
  console.log('Member count:', res.rows.length);

  const dates = [
    '2026-04-05T08:00:00.000Z',
    '2026-04-12T09:30:00.000Z',
    '2026-04-19T14:15:00.000Z',
    '2026-04-26T16:00:00.000Z',
    '2026-05-04T10:00:00.000Z',
    '2026-05-11T11:20:00.000Z',
    '2026-05-18T16:45:00.000Z',
    '2026-05-25T14:00:00.000Z',
    '2026-06-02T09:00:00.000Z',
    '2026-06-09T13:30:00.000Z',
    '2026-06-16T15:10:00.000Z',
    '2026-06-23T08:40:00.000Z',
    '2026-06-30T10:00:00.000Z',
    '2026-07-06T10:15:00.000Z',
    '2026-07-13T14:00:00.000Z',
    '2026-07-20T11:30:00.000Z',
    '2026-07-27T16:20:00.000Z',
    '2026-08-03T09:45:00.000Z',
    '2026-08-10T13:00:00.000Z',
    '2026-08-17T15:30:00.000Z',
    '2026-08-24T10:20:00.000Z',
    '2026-08-31T14:50:00.000Z',
    '2026-09-02T08:30:00.000Z',
    '2026-09-05T11:15:00.000Z',
    '2026-09-08T14:00:00.000Z',
    '2026-09-12T16:30:00.000Z',
    '2026-09-15T09:10:00.000Z',
    '2026-09-18T13:40:00.000Z',
    '2026-09-20T10:00:00.000Z',
    '2026-09-22T11:30:00.000Z',
    '2026-09-24T14:20:00.000Z',
    '2026-09-25T15:45:00.000Z',
    '2026-09-26T08:00:00.000Z'
  ];

  for (let i = 0; i < res.rows.length; i++) {
    const row = res.rows[i];
    const joinedAt = dates[i] || '2026-09-26T08:00:00.000Z';
    const dateOnly = joinedAt.slice(0, 10);
    await client.query('UPDATE public.members SET joined_at = $1::date, created_at = $2::timestamptz WHERE id = $3', [dateOnly, joinedAt, row.id]);
  }

  // Also check invoices: let's see how many invoices we have
  const invRes = await client.query('SELECT COUNT(*), status FROM public.invoices GROUP BY status;');
  console.log('Invoices summary:', invRes.rows);

  console.log('✓ Successfully distributed member joined dates across last 6 months!');
  await client.end();
}

main().catch(console.error);
