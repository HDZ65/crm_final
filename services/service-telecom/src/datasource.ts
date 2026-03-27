import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'telecom_db',
  entities: ['src/domain/**/*.entity.ts', 'dist/domain/**/*.entity.js'],
  migrations: ['src/migrations/*.ts', 'dist/migrations/*.js'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
