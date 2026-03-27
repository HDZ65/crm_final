import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Charger les variables d'environnement
dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'core_db',
  namingStrategy: new SnakeNamingStrategy(),
  entities: [`${__dirname}/**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false, // TOUJOURS false - on utilise les migrations
  logging: process.env.NODE_ENV === 'development',
  extra: {
    // PERFORMANCE: Pool augmenté pour production multi-utilisateurs
    max: 25,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
    statement_timeout: 30000, // Kill queries > 30s
  },
};

// DataSource pour la CLI TypeORM
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
