const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app' });

async function run() {
  await client.connect();
  const c = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companies'");
  console.log('companies:', c.rows.map(r => r.column_name));
  const cm = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'company_members'");
  console.log('company_members:', cm.rows.map(r => r.column_name));
  await client.end();
}
run().catch(console.error);
