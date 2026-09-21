const { Client } = require('pg');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function run() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  const res = await c.query("SELECT id, code, name, contact, email, phone FROM public.members WHERE email = 'vumikasa6@gmail.com'");
  console.log('Member record:', res.rows);
  if (res.rows.length > 0 && !res.rows[0].code) {
    await c.query("UPDATE public.members SET code = 'M1983-029' WHERE email = 'vumikasa6@gmail.com'");
    console.log('Updated code to M1983-029');
  }
  await c.end();
}

run().catch(console.error);
