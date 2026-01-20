import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FactureEntity } from './facture.entity';
import { ContratEntity } from './contrat.entity';
import { OrganisationEntity } from './organisation.entity';
import { SocieteEntity } from './societe.entity';
import { ClientBaseEntity } from './client-base.entity';
import { ProduitEntity } from './produit.entity';
import { ScheduleStatus, PSPName } from '../../../core/domain/payment.enums';

@Entity('schedules')
export class ScheduleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column({ type: 'varchar', nullable: true })
  factureId: string | null;

  @ManyToOne(() => FactureEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'factureId' })
  facture: FactureEntity;

  @Column({ type: 'varchar', nullable: true })
  contratId: string | null;

  @ManyToOne(() => ContratEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'contratId' })
  contrat: ContratEntity;

  @Column({ type: 'varchar', nullable: true })
  societeId: string | null;

  @ManyToOne(() => SocieteEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'societeId' })
  societe: SocieteEntity;

  @Column({ type: 'varchar', nullable: true })
  clientId: string | null;

  @ManyToOne(() => ClientBaseEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: ClientBaseEntity;

  @Column({ type: 'varchar', nullable: true })
  produitId: string | null;

  @ManyToOne(() => ProduitEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'produitId' })
  produit: ProduitEntity;

  // Payment info
  @Column({ type: 'enum', enum: PSPName })
  pspName: PSPName;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalAmount: number | null; // Prix au moment de la souscription

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  // Contract dates
  @Column({ type: 'timestamptz', nullable: true })
  contractStartDate: Date | null; // Début du contrat

  @Column({ type: 'timestamptz', nullable: true })
  contractEndDate: Date | null; // Fin du contrat (renouvellement explicite requis après)

  @Column({ type: 'timestamptz', nullable: true })
  priceLockedAt: Date | null; // Date à laquelle le prix a été fixé

  // Scheduling
  @Column({ type: 'timestamptz' })
  dueDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  nextDueDate: Date | null;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', nullable: true })
  intervalUnit: 'day' | 'week' | 'month' | 'year' | null;

  @Column({ type: 'int', nullable: true, default: 1 })
  intervalCount: number | null;

  // Status
  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.PLANNED,
  })
  status: ScheduleStatus;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastFailureAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastFailureReason: string | null;

  // PSP references
  @Column({ type: 'varchar', nullable: true })
  pspMandateId: string | null;

  @Column({ type: 'varchar', nullable: true })
  pspCustomerId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
