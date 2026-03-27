import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('configuration_bundle')
@Index(['organisationId'], { unique: true })
export class ConfigurationBundleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'remise_justi_plus_avec_conciergerie', type: 'decimal', precision: 12, scale: 2, default: 4 })
  remiseJustiPlusAvecConciergerie: number;

  @Column({ name: 'remise_wincash_avec_conciergerie', type: 'decimal', precision: 12, scale: 2, default: 4 })
  remiseWincashAvecConciergerie: number;

  @Column({ name: 'remise_both_avec_conciergerie', type: 'decimal', precision: 12, scale: 2, default: 8 })
  remiseBothAvecConciergerie: number;

  @Column({ name: 'prix_standalone', type: 'decimal', precision: 12, scale: 2, default: 9.9 })
  prixStandalone: number;

  @Column({ name: 'prix_justi_plus_standalone', type: 'decimal', precision: 12, scale: 2, default: 9.9 })
  prixJustiPlusStandalone: number;

  @Column({ name: 'prix_wincash_standalone', type: 'decimal', precision: 12, scale: 2, default: 9.9 })
  prixWincashStandalone: number;

  @Column({ name: 'prix_conciergerie_standalone', type: 'decimal', precision: 12, scale: 2, default: 9.9 })
  prixConciergerieStandalone: number;

  @Column({ name: 'pro_rata_enabled', default: true })
  proRataEnabled: boolean;

  @Column({ name: 'grouped_billing_enabled', default: true })
  groupedBillingEnabled: boolean;

  @Column({ default: true })
  actif: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
