const { Client } = require('pg');
const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function fixVu() {
  const pg = new Client({ connectionString: DB_URL });
  await pg.connect();
  console.log('Connected to PostgreSQL...');

  // Reset dead cover_url and avatar_url for Pham Van Vu (00000000-0000-4000-8000-000000000002)
  const res1 = await pg.query(`
    UPDATE public.members 
    SET cover_url = NULL, updated_at = NOW() 
    WHERE id = '00000000-0000-4000-8000-000000000002' OR code = 'M1983-002';
  `);
  console.log('Updated public.members rows:', res1.rowCount);

  const res2 = await pg.query(`
    UPDATE public.vione_users 
    SET cover_url = NULL, avatar_url = NULL, updated_at = NOW() 
    WHERE id = '00000000-0000-4000-8000-000000000002' OR email = 'admin@connect.vn';
  `);
  console.log('Updated public.vione_users rows:', res2.rowCount);

  const res3 = await pg.query(`
    UPDATE public.user_profiles 
    SET avatar_url = NULL, updated_at = NOW() 
    WHERE user_id = '00000000-0000-4000-8000-000000000002';
  `);
  console.log('Updated public.user_profiles rows:', res3.rowCount);

  // Also clean any other members with dead URLs
  const res4 = await pg.query(`
    UPDATE public.members 
    SET cover_url = NULL 
    WHERE cover_url LIKE '%g4pkai%' OR cover_url LIKE '%i5o6ez%' OR cover_url LIKE '%d9ut5z%';
  `);
  console.log('Cleaned other members dead covers:', res4.rowCount);

  await pg.end();
  console.log('DB cleanup completed successfully!');
}

fixVu().catch(err => {
  console.error('fixVu error:', err);
  process.exit(1);
});
