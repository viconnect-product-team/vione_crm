const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();

  try {
    const notifs = await client.query(`
      SELECT id, notification_kind, source_domain, action_target, safe_display_data 
      FROM public.business_connect_notifications 
      ORDER BY created_at DESC LIMIT 10
    `);
    console.log('business_connect_notifications:', JSON.stringify(notifs.rows, null, 2));
  } catch (e) {
    console.log('Error business_connect_notifications:', e.message);
  }

  try {
    const opps = await client.query(`SELECT id, title, author_user_id, association_id FROM public.business_opportunities LIMIT 10`);
    console.log('business_opportunities:', JSON.stringify(opps.rows, null, 2));
  } catch (e) {
    console.log('Error business_opportunities:', e.message);
  }

  await client.end();
}

main().catch(console.error);
