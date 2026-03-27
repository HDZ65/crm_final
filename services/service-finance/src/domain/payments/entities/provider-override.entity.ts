import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum OverrideScope {
  CLIENT = 'CLIENT',
  CONTRAT = 'CONTRAT',
}

@Entity('provider_overrides')
@Index(['scope', 'scopeId'])
export class ProviderOverrideEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: OverrideScope,
  })
  scope: OverrideScope;

  @Column({ name: 'scope_id', type: 'uuid' })
  scopeId: string;

  @Column({ name: 'provider_account_id', type: 'uuid' })
  providerAccountId: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
