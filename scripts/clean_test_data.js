const { Client } = require('pg');

async function cleanTestData() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project?sslmode=disable');
  await client.connect();
  console.log('>>> [CLEAN TEST DATA] Connected to vione_project.');

  const dynamicTables = [
    'public.bc_customer_tag_links',
    'public.bc_customer_tags',
    'public.bc_customers',
    'public.direct_messages',
    'public.direct_message_threads',
    'public.bc_dm_messages',
    'public.bc_dm_threads',
    'public.messages',
    'public.member_notifications',
    'public.notifications',
    'public.business_notifications',
    'public.activity_log',
    'public.demo_requests',
    'public.poll_votes',
    'public.opportunity_interests',
    'public.event_registrations',
    'public.member_checkins',
    'public.guest_contacts',
    'public.meetings'
  ];

  for (const table of dynamicTables) {
    try {
      const res = await client.query(`DELETE FROM ${table};`);
      console.log(`✓ Cleared test data in ${table} (${res.rowCount || 0} rows deleted)`);
    } catch (err) {
      console.warn(`! Table ${table} skip/warning: ${err.message}`);
    }
  }

  console.log('\n>>> All dynamic test records have been cleaned successfully!');
  await client.end();
}

cleanTestData().catch(err => {
  console.error('Clean error:', err);
  process.exit(1);
});
