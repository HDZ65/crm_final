/**
 * TypeORM Configuration Factory
 *
 * Centralized TypeORM configuration for all services.
 *
 * @module @crm/shared-kernel/persistence
 */

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  logging?: boolean;
}

/**
 * TypeORM configuration factory
 */
export class TypeOrmConfigFactory {
  static createNestConfig(
    config: DatabaseConfig,
    migrations: string[] = ['dist/**/migrations/*.js'],
    overrides: Partial<TypeOrmModuleOptions> = {},
  ): TypeOrmModuleOptions {
    return {
      type: 'postgres' as const,
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database,
      migrations,
      synchronize: false,
      logging: config.logging ?? false,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
      ...overrides,
    } as TypeOrmModuleOptions;
  }

  static createDataSourceConfig(
    config: DatabaseConfig,
    entities: string[],
    migrations: string[],
  ): DataSourceOptions {
    return {
      type: 'postgres',
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database,
      entities,
      migrations,
      synchronize: false,
    };
  }

  static fromEnv(prefix: string = 'DB'): DatabaseConfig {
    return {
      host: process.env[`${prefix}_HOST`] || 'localhost',
      port: parseInt(process.env[`${prefix}_PORT`] || '5432', 10),
      username: process.env[`${prefix}_USERNAME`] || 'crm',
      password: process.env[`${prefix}_PASSWORD`] || 'crm',
      database: process.env[`${prefix}_DATABASE`] || 'crm_db',
      ssl: process.env[`${prefix}_SSL`] === 'true',
      logging: process.env[`${prefix}_LOGGING`] === 'true',
    };
  }

  static fromConfigService(
    configService: { get: (key: string, defaultValue?: string) => string },
    prefix: string = 'DB',
  ): DatabaseConfig {
    return {
      host: configService.get(`${prefix}_HOST`, 'localhost'),
      port: parseInt(configService.get(`${prefix}_PORT`, '5432'), 10),
      username: configService.get(`${prefix}_USERNAME`, 'crm'),
      password: configService.get(`${prefix}_PASSWORD`, 'crm'),
      database: configService.get(`${prefix}_DATABASE`, 'crm_db'),
      ssl: configService.get(`${prefix}_SSL`, 'false') === 'true',
      logging: configService.get(`${prefix}_LOGGING`, 'false') === 'true',
    };
  }
}
