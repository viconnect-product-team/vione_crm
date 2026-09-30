const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project' });
async function main() {
  await client.connect();
  await client.query(`
    ALTER TABLE public.business_identities ADD COLUMN IF NOT EXISTS cover_url TEXT;
  `);
  console.log('Added cover_url to business_identities successfully!');
  await client.end();
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
