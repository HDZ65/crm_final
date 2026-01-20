/**
 * Data Source Configuration - SnakeNamingStrategy Template
 *
 * CONCEPT CLÉ:
 * - TypeScript code: camelCase (ex: organisationId, createdAt)
 * - Database columns: snake_case (ex: organisation_id, created_at)
 * - Conversion: AUTOMATIQUE via SnakeNamingStrategy
 * - PAS de mapping manuel @Column({ name: '...' })
 *
 * ATTENTION: NE PAS éditer manuellement @Column name='xxx'
 *           Ces mappings doivent être générés depuis proto
 */

import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm/naming-strategies/SnakeNamingStrategy';

export const AppDataSource = new DataSource({
  type: 'postgres',

  // Configuration connexion
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'users_db',

  // ⚠️ CRITICAL: Naming strategy active = conversion camelCase ↔ snake_case automatique
  namingStrategy: new SnakeNamingStrategy(),

  // Auto-chargement des entités (sera remplacé par entités générées depuis proto)
  entities: ['src/**/*.entity.ts'],

  // Configuration connection pool
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Synchronisation : uniquement en development (JAMAIS en production)
  synchronize: process.env.NODE_ENV === 'development',
});

/**
 * Exemple d'utilisation correct avec SnakeNamingStrategy
 *
 * ✅ CORRECT - Entité manuelle SANS @Column explicite
 * @Entity('client_bases')
 * export class ClientBaseEntity {
 *   @PrimaryGeneratedColumn('uuid')
 *   id: string;  // snake_case AUTO en DB: 'id'
 *
 *   // snake_case AUTO en DB: 'organisation_id'
 *   organisationId: string;
 *
 *   // snake_case AUTO en DB: 'created_at'
 *   @CreateDateColumn({ name: 'created_at' })
 *   createdAt: Date;
 *
 *   @UpdateDateColumn({ name: 'updated_at' })
 *   updatedAt: Date;
 * }
 *
 * ❌ INTERDIT - Mapping manuel (violation architecture contract-driven)
 * @Entity('client_bases')
 * export class ClientBaseEntity {
 *   @PrimaryGeneratedColumn('uuid')
 *   id: string;
 *
 *   @Column({ name: 'organisation_id', type: 'uuid' })  // ❌ Mapping manuel !
 *   organisationId: string;
 *
 *   @Column({ name: 'nom', length: 100 })  // ❌ Mapping manuel !
 *   nom: string;
 * }
 *
 * RÈGLE ABSOLUE:
 * - JAMAIS de @Column({ name: 'xxx' }) pour snake_case standard
 * - Uniquement @Column() sans options ou pour contraintes spéciales
 * - La conversion camelCase ↔ snake_case est AUTOMATIQUE via namingStrategy
 */
