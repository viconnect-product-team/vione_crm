const { Client } = require('pg');
const DB_CONN = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function checkOwner() {
  const c = new Client(DB_CONN);
  await c.connect();
  const cols = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'");
  console.log('Columns of products:', cols.rows.map(r => r.column_name));
  const res = await c.query('SELECT * FROM public.products LIMIT 2');
  console.log('Sample product:', res.rows[0]);
  const mRes = await c.query("SELECT id, code, email, name, user_id FROM public.members WHERE email LIKE '%tongthuky%' OR code = 'M1983-001'");
  console.log('Member:', mRes.rows);

  if (mRes.rows.length > 0 && res.rows.length > 0) {
    const mem = mRes.rows[0];
    const prodId = res.rows[0].id;
    // Update seller or user
    const updateCol = cols.rows.some(r => r.column_name === 'seller_id') ? 'seller_id' : 'user_id';
    await c.query(`UPDATE public.products SET ${updateCol} = $1 WHERE id = $2`, [mem.id, prodId]);
    console.log(`Updated product ${prodId} to be owned by member ${mem.name} (${mem.id})`);
  }
  // Also check opportunities
  const oCols = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'opportunities'");
  console.log('Columns of opportunities:', oCols.rows.map(r => r.column_name));
  const oRes = await c.query('SELECT * FROM public.opportunities LIMIT 2');
  console.log('Sample opportunity:', oRes.rows[0]);
  if (mRes.rows.length > 0 && oRes.rows.length > 0) {
    const mem = mRes.rows[0];
    const oppId = oRes.rows[0].id;
    const oppCol = oCols.rows.some(r => r.column_name === 'author_id') ? 'author_id' : (oCols.rows.some(r => r.column_name === 'user_id') ? 'user_id' : 'poster_id');
    await c.query(`UPDATE public.opportunities SET ${oppCol} = $1 WHERE id = $2`, [mem.user_id || mem.id, oppId]);
    console.log(`Updated opportunity ${oppId} to be owned by member ${mem.name}`);
  }

  await c.end();
}

checkOwner().catch(console.error);
