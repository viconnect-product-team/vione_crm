const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/postgres"
});

async function main() {
  await client.connect();
  console.log('Connected to postgres database.');
  try {
    console.log('Terminating other sessions to vione_app...');
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'vione_app'
        AND pid <> pg_backend_pid();
    `);
    
    // Sometimes terminating connections takes a second
    await new Promise(resolve => setTimeout(resolve, 1000));

    await client.query('DROP DATABASE IF EXISTS vione_app');
    console.log('Database vione_app dropped.');
    await client.query('CREATE DATABASE vione_app');
    console.log('Database vione_app created.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
