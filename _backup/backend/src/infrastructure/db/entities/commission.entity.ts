import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrganisationEntity } from './organisation.entity';
import { ApporteurEntity } from './apporteur.entity';
import { ContratEntity } from './contrat.entity';
import { ProduitEntity } from './produit.entity';
import { StatutCommissionEntity } from './statut-commission.entity';

@Entity('commissions')
export class CommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column({ unique: true })
  reference: string;

  @Column()
  apporteurId: string;

  @ManyToOne(() => ApporteurEntity)
  @JoinColumn({ name: 'apporteurId' })
  apporteur: ApporteurEntity;

  @Column()
  contratId: string;

  @ManyToOne(() => ContratEntity)
  @JoinColumn({ name: 'contratId' })
  contrat: ContratEntity;

  @Column({ type: 'uuid', nullable: true })
  produitId: string | null;

  @ManyToOne(() => ProduitEntity, { nullable: true })
  @JoinColumn({ name: 'produitId' })
  produit: ProduitEntity | null;

  @Column()
  compagnie: string;

  @Column()
  typeBase: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantBrut: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantReprises: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantAcomptes: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantNetAPayer: number;

  @Column()
  statutId: string;

  @ManyToOne(() => StatutCommissionEntity)
  @JoinColumn({ name: 'statutId' })
  statut: StatutCommissionEntity;

  @Column()
  periode: string;

  @Column({ type: 'timestamptz' })
  dateCreation: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
