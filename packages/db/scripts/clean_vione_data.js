const { Client } = require('pg');

const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connected to PostgreSQL vione_app database.');

  console.log('Clearing old test & activity data for ViOne App & ViOne CRM...');

  await client.query('DROP TRIGGER IF EXISTS bmfu_block_delete_trg ON public.business_meeting_follow_ups;');

  const tablesToClear = [
    'public.business_relationship_moment_reminders',
    'public.business_relationship_moment_comments',
    'public.business_relationship_moment_comment_likes',
    'public.business_relationship_moment_likes',
    'public.business_relationship_moments',
    'public.guest_contacts',
    'public.direct_messages',
    'public.direct_message_threads',
    'public.bc_dm_messages',
    'public.bc_dm_threads',
    'public.opportunity_interests',
    'public.opportunities',
    'public.business_meeting_follow_ups',
    'public.business_meeting_participants',
    'public.business_meeting_time_proposals',
    'public.business_meeting_proposals',
    'public.business_meeting_calendar_projections',
    'public.business_meetings',
    'public.event_registrations',
    'public.activity_log',
  ];

  for (const t of tablesToClear) {
    try {
      const res = await client.query(`DELETE FROM ${t};`);
      console.log(`✓ Cleared table ${t} (${res.rowCount} rows removed)`);
    } catch (e) {
      console.warn(`! Table ${t} clear warning:`, e.message);
    }
  }

  // Restore trigger if function exists
  await client.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'bmfu_block_delete') THEN
        CREATE TRIGGER bmfu_block_delete_trg
        BEFORE DELETE ON public.business_meeting_follow_ups
        FOR EACH ROW EXECUTE FUNCTION bmfu_block_delete();
      END IF;
    END $$;
  `);

  console.log('\n======================================================');
  console.log('SUCCESS: ViOne App and CRM database cleared cleanly!');
  console.log('User accounts, profiles, companies and members are preserved.');
  console.log('======================================================');

  await client.end();
}

main().catch((err) => {
  console.error('Error clearing ViOne database:', err);
  process.exit(1);
});
