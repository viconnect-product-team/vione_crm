const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'business_relationship_moments'
  `);
  console.log('Columns:', cols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  
  const recents = await client.query(`
    SELECT id, owner_user_id, target_kind, status, visibility, created_at, occurred_at, note 
    FROM public.business_relationship_moments 
    ORDER BY created_at DESC NULLS LAST, occurred_at DESC 
    LIMIT 10
  `);
  console.log('Recent 10 moments:', JSON.stringify(recents.rows, null, 2));

  // Also test the exact query used in getNetworkFeed
  if (recents.rows.length > 0) {
    const testUserId = recents.rows[0].owner_user_id;
    console.log('Testing getNetworkFeed query for userId:', testUserId);
    try {
      const q = await client.query(`
        SELECT 
          m.id, 
          m.owner_user_id,
          m.target_kind, 
          m.target_user_id, 
          m.target_card_id, 
          m.target_guest_id, 
          m.occurred_at, 
          m.created_at,
          m.event_name, 
          m.place_label, 
          m.note,
          COALESCE(m.visibility, 'friends') as visibility,
          bi_owner.display_name as owner_display_name,
          bi_owner.avatar_url as owner_avatar_url,
          bi_owner.job_title as owner_job_title,
          bi_owner.company_name as owner_company_name,
          u_owner.email as owner_email,
          bi_target.display_name as target_display_name,
          bi_target.avatar_url as target_avatar_url,
          bi_target.job_title as target_job_title,
          bi_target.company_name as target_company_name,
          c.display_name as card_display_name,
          c.avatar_url as card_avatar_url,
          c.company_name as card_company_name,
          g.display_name as guest_display_name,
          g.company_name as guest_company_name
        FROM public.business_relationship_moments m
        LEFT JOIN public.business_identities bi_owner ON m.owner_user_id = bi_owner.owner_user_id
        LEFT JOIN public.vione_users u_owner ON m.owner_user_id = u_owner.id
        LEFT JOIN public.business_identities bi_target ON m.target_user_id = bi_target.owner_user_id
        LEFT JOIN public.member_business_cards c ON m.target_card_id = c.id
        LEFT JOIN public.guest_contacts g ON m.target_guest_id = g.id
        WHERE (
          m.owner_user_id = '${testUserId}'::uuid 
          OR (m.target_user_id = '${testUserId}'::uuid AND COALESCE(m.visibility, 'friends') != 'private')
          OR (COALESCE(m.visibility, 'friends') = 'public')
          OR (
            COALESCE(m.visibility, 'friends') = 'friends'
            AND m.owner_user_id IN (
              SELECT CASE 
                WHEN requester_user_id = '${testUserId}'::uuid THEN recipient_user_id 
                WHEN recipient_user_id = '${testUserId}'::uuid THEN requester_user_id
                WHEN pair_user_low = '${testUserId}'::uuid THEN pair_user_high 
                ELSE pair_user_low 
              END
              FROM public.user_connections
              WHERE (requester_user_id = '${testUserId}'::uuid OR recipient_user_id = '${testUserId}'::uuid
                     OR pair_user_low = '${testUserId}'::uuid OR pair_user_high = '${testUserId}'::uuid)
                AND status = 'accepted'::public.global_connection_status
            )
          )
        )
          AND m.status IN ('active', 'pending')
        ORDER BY m.created_at DESC, m.occurred_at DESC, m.id DESC
        LIMIT 13
      `);
      console.log('Query succeeded, rows returned:', q.rows.length);
      console.log('Query rows returned items:', q.rows.map(r => ({ id: r.id, owner: r.owner_user_id, kind: r.target_kind, date: r.created_at })));
    } catch (e) {
      console.error('getNetworkFeed query FAILED:', e);
    }
  }

  const allMedia = await client.query(`
    SELECT * FROM public.business_relationship_moment_media
    ORDER BY sort_order ASC
    LIMIT 10
  `);
  console.log('Recent media in DB:', allMedia.rows);

  await client.end();
}

check().catch(console.error);
