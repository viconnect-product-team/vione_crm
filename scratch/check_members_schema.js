const { Client } = require('pg');

async function check() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();
  const media = await client.query("SELECT id, name, code, department, phone FROM public.members WHERE department ILIKE '%Truyền thông%' OR department ILIKE '%Media%'");
  console.log('Media dept members:', media.rows);
  const allDepts = await client.query('SELECT DISTINCT department FROM public.members');
  console.log('All departments:', allDepts.rows.map(r => r.department));
  await client.end();
}

check().catch(console.error);
