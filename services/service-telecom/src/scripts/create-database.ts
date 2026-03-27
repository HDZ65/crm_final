import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_DATABASE || 'telecom_db';

async function createDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();

    const result = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]);

    if (result.rows.length === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Database "${DB_NAME}" created successfully`);

      const dbClient = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: DB_NAME,
      });

      await dbClient.connect();
      await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await dbClient.end();
    } else {
      console.log(`Database "${DB_NAME}" already exists`);
    }
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
