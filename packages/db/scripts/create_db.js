const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/postgres"
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL.');
  try {
    await client.query('CREATE DATABASE vione_app');
    console.log('Database vione_app created successfully!');
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
