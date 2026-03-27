import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'integrations_db',
  namingStrategy: new SnakeNamingStrategy(),
  entities: [`${__dirname}/**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
