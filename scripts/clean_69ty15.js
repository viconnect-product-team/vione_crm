const { Client } = require('pg');
async function clean() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();
  const userId = '00000000-0000-4000-8000-000000000002';
  await client.query('UPDATE public.business_identities SET avatar_url = NULL WHERE owner_user_id = $1', [userId]);
  await client.query('UPDATE public.user_profiles SET avatar_url = NULL WHERE user_id = $1', [userId]);
  await client.query('UPDATE public.vione_users SET avatar_url = NULL WHERE id = $1', [userId]);
  await client.query('UPDATE public.member_business_cards SET avatar_url = NULL WHERE owner_user_id = $1', [userId]);
  await client.query('DELETE FROM public.user_uploads WHERE filename LIKE $1', ['%69ty15%']);
  await client.query('UPDATE public.business_identities SET avatar_url = NULL WHERE avatar_url LIKE $1', ['%jj90a4%']);
  await client.query('UPDATE public.user_profiles SET avatar_url = NULL WHERE avatar_url LIKE $1', ['%jj90a4%']);
  await client.query('UPDATE public.vione_users SET avatar_url = NULL WHERE avatar_url LIKE $1', ['%jj90a4%']);
  await client.query('UPDATE public.member_business_cards SET avatar_url = NULL WHERE avatar_url LIKE $1', ['%jj90a4%']);
  await client.query('DELETE FROM public.user_uploads WHERE filename LIKE $1', ['%jj90a4%']);
  console.log('Successfully cleaned 69ty15 and jj90a4 from database!');
  await client.end();
}
clean().catch(console.error);
