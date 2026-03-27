/**
 * Base ORM Entity Classes
 *
 * Common TypeORM entity base classes with standard audit fields.
 *
 * Convention: TOUTES les entites metier DOIVENT avoir soft delete (deleted_at).
 *
 * @module @crm/shared-kernel/persistence
 */

import { Column, CreateDateColumn, PrimaryColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

/**
 * Base ORM entity with common audit fields
 * Note: `declare` is used because TypeORM decorators handle property initialization
 */
export abstract class BaseOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  declare id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  declare updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  declare deletedAt: Date | null;
}

/**
 * Base ORM entity with optimistic locking
 */
export abstract class VersionedOrmEntity extends BaseOrmEntity {
  @VersionColumn({ default: 1 })
  declare version: number;
}
