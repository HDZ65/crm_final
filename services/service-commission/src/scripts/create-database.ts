/**
 * Script pour créer la base de données si elle n'existe pas
 * Usage: npm run db:create
 */
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_DATABASE || 'commission_db';

async function createDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Se connecter à la DB par défaut
  });

  try {
    await client.connect();
    
    // Vérifier si la database existe
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    );

    if (result.rows.length === 0) {
      // Créer la database
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✅ Database "${DB_NAME}" created successfully`);
      
      // Se connecter à la nouvelle DB pour ajouter l'extension uuid-ossp
      const newClient = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: DB_NAME,
      });
      
      await newClient.connect();
      await newClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log(`✅ Extension "uuid-ossp" enabled on "${DB_NAME}"`);
      await newClient.end();
    } else {
      console.log(`ℹ️  Database "${DB_NAME}" already exists`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
