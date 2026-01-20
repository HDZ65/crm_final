import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CommissionEntity } from './commission.entity';

@Entity('reprises_commission')
export class RepriseCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'commission_originale_id', type: 'uuid' })
  commissionOriginaleId: string;

  @Column({ name: 'contrat_id', type: 'uuid' })
  contratId: string;

  @Column({ name: 'apporteur_id', type: 'uuid' })
  apporteurId: string;

  @Column({ length: 100 })
  reference: string;

  @Column({
    name: 'type_reprise',
    type: 'varchar',
    length: 20,
    default: 'resiliation',
  })
  typeReprise: string;

  @Column({
    name: 'montant_reprise',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  montantReprise: number;

  @Column({
    name: 'taux_reprise',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 100,
  })
  tauxReprise: number;

  @Column({
    name: 'montant_original',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  montantOriginal: number;

  @Column({ name: 'periode_origine', length: 7 })
  periodeOrigine: string;

  @Column({ name: 'periode_application', length: 7 })
  periodeApplication: string;

  @Column({ name: 'date_evenement', type: 'date' })
  dateEvenement: Date;

  @Column({ name: 'date_limite', type: 'date' })
  dateLimite: Date;

  @Column({ name: 'date_application', type: 'date', nullable: true })
  dateApplication: Date | null;

  @Column({
    name: 'statut_reprise',
    type: 'varchar',
    length: 20,
    default: 'en_attente',
  })
  statutReprise: string;

  @Column({ name: 'bordereau_id', type: 'uuid', nullable: true })
  bordereauId: string | null;

  @Column({ type: 'text', nullable: true })
  motif: string | null;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CommissionEntity)
  @JoinColumn({ name: 'commission_originale_id' })
  commissionOriginale: CommissionEntity;
}
