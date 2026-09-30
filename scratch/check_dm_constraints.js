const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project' });
async function main() {
  await client.connect();
  const resThreads = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND conrelid = 'public.direct_message_threads'::regclass;
  `);
  console.log('direct_message_threads constraints:', resThreads.rows);

  const resMessages = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND conrelid = 'public.direct_messages'::regclass;
  `);
  console.log('direct_messages constraints:', resMessages.rows);

  await client.end();
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
