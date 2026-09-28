const { Client } = require('pg');

async function checkDb(dbName) {
  const client = new Client(`postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/${dbName}?schema=public&pgbouncer=true`);
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('business_identities', 'identity_share_links', 'user_profiles')
    `);
    console.log(`Database [${dbName}] tables:`, res.rows.map(r => r.table_name));

    if (res.rows.some(r => r.table_name === 'business_identities')) {
      const cnt = await client.query('SELECT count(*) FROM public.business_identities');
      console.log(`  -> business_identities count: ${cnt.rows[0].count}`);
    }
    await client.end();
  } catch (err) {
    console.log(`Database [${dbName}] error:`, err.message);
  }
}

async function run() {
  await checkDb('vione_app');
  await checkDb('vione_project');
  await checkDb('vione_standalone_app');
  await checkDb('ceo1983_project');
}

run();
