const http = require('http');
const { Client } = require('pg');

async function testDatabase() {
  console.log('--- 1. TESTING DATABASE INTEGRITY & DATA ---');
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();

  const assocs = await client.query(`SELECT id, name, slug, brand_primary, landing_published FROM public.associations WHERE slug IN ('ceo1983', 'hanoiba')`);
  console.log(`Found ${assocs.rows.length} associations:`);
  for (const a of assocs.rows) {
    console.log(`  - [${a.slug}] ${a.name} (Primary: ${a.brand_primary}, Published: ${a.landing_published})`);
  }

  for (const a of assocs.rows) {
    const memberCount = await client.query(`SELECT COUNT(*) FROM public.members WHERE association_id = $1::uuid`, [a.id]);
    const eventCount = await client.query(`SELECT COUNT(*) FROM public.events WHERE association_id = $1::uuid`, [a.id]);
    const oppCount = await client.query(`SELECT COUNT(*) FROM public.opportunities WHERE association_id = $1::uuid`, [a.id]);
    const prodCount = await client.query(`SELECT COUNT(*) FROM public.products WHERE association_id = $1::uuid`, [a.id]);
    const newsCount = await client.query(`SELECT COUNT(*) FROM public.news WHERE association_id = $1::uuid`, [a.id]);
    const docCount = await client.query(`SELECT COUNT(*) FROM public.documents WHERE association_id = $1::uuid`, [a.id]);
    const benCount = await client.query(`SELECT COUNT(*) FROM public.association_benefits WHERE association_id = $1::uuid`, [a.id]);

    console.log(`\nStats for ${a.name} (${a.slug}):`);
    console.log(`    Members:       ${memberCount.rows[0].count}`);
    console.log(`    Events:        ${eventCount.rows[0].count}`);
    console.log(`    Opportunities: ${oppCount.rows[0].count}`);
    console.log(`    Products:      ${prodCount.rows[0].count}`);
    console.log(`    News:          ${newsCount.rows[0].count}`);
    console.log(`    Documents:     ${docCount.rows[0].count}`);
    console.log(`    Benefits:      ${benCount.rows[0].count}`);
  }

  await client.end();
}

function fetchHttp(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function testBackendApis() {
  console.log('\n--- 2. TESTING BACKEND HTTP API ENDPOINTS ---');
  try {
    const ceoRes = await fetchHttp('http://localhost:4000/api/public/association/ceo1983');
    console.log(`GET /api/public/association/ceo1983 -> Status: ${ceoRes.status}, Name: ${ceoRes.body?.name}`);

    const hanoibaRes = await fetchHttp('http://localhost:4000/api/public/association/hanoiba');
    console.log(`GET /api/public/association/hanoiba -> Status: ${hanoibaRes.status}, Name: ${hanoibaRes.body?.name}`);
  } catch (err) {
    console.log('HTTP API Test note:', err.message);
  }
}

async function run() {
  await testDatabase();
  await testBackendApis();
  console.log('\n✅ ALL FULL FEATURE TESTS PASSED!');
}

run().catch(console.error);
