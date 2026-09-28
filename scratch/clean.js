const { Client } = require('pg');
async function main() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();
  await client.query("DELETE FROM public.members WHERE id IN ('MB_TEST_SUCCESS', 'MB_TEST_1')");
  console.log('CLEANED UP');
  await client.end();
}
main().catch(console.error);
