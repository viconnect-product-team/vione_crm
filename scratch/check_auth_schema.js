const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project' });
async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND conrelid = 'public.business_identities'::regclass;
  `);
  console.log('business_identities constraints:', res.rows);

  const resMoments = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'moments';
  `);
  console.log('moments columns:', resMoments.rows);

  const resMomentsCon = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND conrelid = 'public.moments'::regclass;
  `);
  console.log('moments constraints:', resMomentsCon.rows);

  await client.end();
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
