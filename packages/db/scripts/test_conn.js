const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
});

async function main() {
  await client.connect();
  console.log('Connected.');
  const res1 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'identity_share_links'");
  console.log('identity_share_links columns:', res1.rows);
  await client.end();
}

main().catch(console.error);
