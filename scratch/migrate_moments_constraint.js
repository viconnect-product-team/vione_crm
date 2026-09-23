const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();

  console.log('Updating business_relationship_moments constraints...');

  await client.query(`ALTER TABLE public.business_relationship_moments DROP CONSTRAINT IF EXISTS brm_target_xor`);
  await client.query(`
    ALTER TABLE public.business_relationship_moments ADD CONSTRAINT brm_target_xor CHECK (
      (target_kind = 'connection' AND target_user_id IS NOT NULL AND target_card_id IS NULL AND target_guest_id IS NULL) OR
      (target_kind = 'saved_card' AND target_card_id IS NOT NULL AND target_user_id IS NULL AND target_guest_id IS NULL) OR
      (target_kind = 'guest_contact' AND target_guest_id IS NOT NULL AND target_user_id IS NULL AND target_card_id IS NULL) OR
      (target_kind = 'general' AND target_user_id IS NULL AND target_card_id IS NULL AND target_guest_id IS NULL)
    )
  `);

  await client.query(`ALTER TABLE public.business_relationship_moments DROP CONSTRAINT IF EXISTS business_relationship_moments_target_kind_check`);
  await client.query(`
    ALTER TABLE public.business_relationship_moments ADD CONSTRAINT business_relationship_moments_target_kind_check
      CHECK (target_kind = ANY (ARRAY['connection'::text, 'saved_card'::text, 'guest_contact'::text, 'general'::text]))
  `);

  console.log('Successfully updated constraints to support general moments!');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
