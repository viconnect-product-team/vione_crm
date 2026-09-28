const { Client } = require('pg');

async function main() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();
  const res = await client.query("SELECT column_name, data_type, udt_name, is_nullable FROM information_schema.columns WHERE table_name = 'members' AND table_schema = 'public' ORDER BY ordinal_position");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
