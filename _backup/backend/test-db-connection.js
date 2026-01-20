const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
});

console.log('Attempting connection with credentials:', {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  database: 'postgres',
});

client.connect()
  .then(() => {
    console.log('✅ CONNECTION SUCCESSFUL!');
    return client.query('SELECT version()');
  })
  .then(res => {
    console.log('PostgreSQL version:', res.rows[0].version);
    return client.end();
  })
  .then(() => {
    console.log('Connection closed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ CONNECTION FAILED:');
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', err);
    process.exit(1);
  });
