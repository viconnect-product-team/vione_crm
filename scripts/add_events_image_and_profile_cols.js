const { Client } = require('pg');
const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function main() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  console.log('Connected to DB');

  // 1. Add image column to public.events
  await c.query(`
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image text;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner text;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_price bigint DEFAULT 0;
  `);
  console.log('Updated public.events columns');

  // 2. Add profile columns to public.members
  await c.query(`
    ALTER TABLE public.members ADD COLUMN IF NOT EXISTS industry_detail text;
    ALTER TABLE public.members ADD COLUMN IF NOT EXISTS company_size text;
    ALTER TABLE public.members ADD COLUMN IF NOT EXISTS featured_products jsonb;
    ALTER TABLE public.members ADD COLUMN IF NOT EXISTS card_visibility_settings jsonb;
  `);
  console.log('Updated public.members columns');

  // 3. Ensure views column on public.opportunities
  await c.query(`
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;
  `);
  console.log('Updated public.opportunities columns');

  // 4. Ensure public.notifications has channel and target_channel
  await c.query(`
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_channel text;
  `);
  console.log('Updated public.notifications columns');

  await c.end();
  console.log('Migration completed successfully');
}

main().catch(console.error);
