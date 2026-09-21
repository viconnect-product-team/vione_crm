const { Client } = require('pg');
const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function main() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();

  const regs = await c.query('SELECT id, lucky_number FROM public.event_registrations');
  console.log(`Found ${regs.rows.length} registrations`);
  for (const r of regs.rows) {
    if (!r.lucky_number) {
      const num = String(Math.floor(1000 + Math.random() * 9000));
      await c.query('UPDATE public.event_registrations SET lucky_number = $1 WHERE id = $2', [num, r.id]);
      console.log(`Assigned lucky number #${num} to ${r.id}`);
    } else {
      console.log(`Reg ${r.id} already has #${r.lucky_number}`);
    }
  }

  await c.end();
  console.log('Backfill complete!');
}

main().catch(console.error);
