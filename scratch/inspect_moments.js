const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();

  const constraints = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'public.business_relationship_moments'::regclass
  `);
  console.log('Constraints on moments:', constraints.rows);

  const triggers = await client.query(`
    SELECT tgname, proname, prosrc
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE tgrelid = 'public.business_relationship_moments'::regclass
  `);
  console.log('Triggers on moments:', triggers.rows);

  await client.end();
}

main().catch(console.error);
