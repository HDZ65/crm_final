import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CasJuridiqueType {
  LITIGE = 'litige',
  CONTENTIEUX = 'contentieux',
  CONSEIL = 'conseil',
  MEDIATION = 'mediation',
  ARBITRAGE = 'arbitrage',
  AUTRE = 'autre',
}

export enum CasJuridiqueStatut {
  OUVERT = 'ouvert',
  EN_COURS = 'en_cours',
  EN_ATTENTE = 'en_attente',
  CLOS_GAGNE = 'clos_gagne',
  CLOS_PERDU = 'clos_perdu',
  CLOS_ACCORD = 'clos_accord',
  ANNULE = 'annule',
}

export enum CasJuridiquePriorite {
  BASSE = 'basse',
  NORMALE = 'normale',
  HAUTE = 'haute',
  CRITIQUE = 'critique',
}

@Entity('cas_juridique')
export class CasJuridique {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id' })
  organisationId: string;

  @Column({ name: 'client_id' })
  clientId: string;

  @Column({ name: 'reference', unique: true })
  reference: string;

  @Column()
  titre: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CasJuridiqueType,
    default: CasJuridiqueType.AUTRE,
  })
  type: CasJuridiqueType;

  @Column({
    type: 'enum',
    enum: CasJuridiqueStatut,
    default: CasJuridiqueStatut.OUVERT,
  })
  statut: CasJuridiqueStatut;

  @Column({
    type: 'enum',
    enum: CasJuridiquePriorite,
    default: CasJuridiquePriorite.NORMALE,
  })
  priorite: CasJuridiquePriorite;

  @Column({ name: 'avocat_id', nullable: true })
  avocatId: string;

  @Column({ name: 'assigne_a', nullable: true })
  assigneA: string;

  @Column({ name: 'cree_par', nullable: true })
  creePar: string;

  @Column({ name: 'montant_enjeu', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montantEnjeu: number;

  @Column({ name: 'montant_provision', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montantProvision: number;

  @Column({ name: 'date_ouverture', type: 'timestamp with time zone', nullable: true })
  dateOuverture: Date;

  @Column({ name: 'date_audience', type: 'timestamp with time zone', nullable: true })
  dateAudience: Date;

  @Column({ name: 'date_cloture', type: 'timestamp with time zone', nullable: true })
  dateCloture: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
