const { Client } = require('pg');

async function test() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();
  const dbs = await client.query('SELECT datname FROM pg_database');
  console.log('Databases:', dbs.rows.map(r => r.datname));
  await client.end();
}

test().catch(console.error);
