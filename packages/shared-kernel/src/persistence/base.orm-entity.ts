/**
 * Base ORM Entity Classes
 *
 * Common TypeORM entity base classes with standard audit fields.
 *
 * Convention: TOUTES les entites metier DOIVENT avoir soft delete (deleted_at).
 *
 * @module @crm/shared-kernel/persistence
 */

import {
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  VersionColumn,
} from 'typeorm';

/**
 * Base ORM entity with common audit fields
 */
export abstract class BaseOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}

/**
 * Base ORM entity with optimistic locking
 */
export abstract class VersionedOrmEntity extends BaseOrmEntity {
  @VersionColumn({ default: 1 })
  version: number;
}
