const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project' });
async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'business_identities';
  `);
  console.log('business_identities columns:', res.rows.map(r => r.column_name));
  await client.end();
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
