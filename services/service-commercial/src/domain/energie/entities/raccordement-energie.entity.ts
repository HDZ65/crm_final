import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

export enum PartenaireEnergie {
  PLENITUDE = 'PLENITUDE',
  OHM = 'OHM',
}

export enum StatutRaccordement {
  DEMANDE_ENVOYEE = 'DEMANDE_ENVOYEE',
  EN_COURS = 'EN_COURS',
  RACCORDE = 'RACCORDE',
  ACTIVE = 'ACTIVE',
  SUSPENDU = 'SUSPENDU',
  RESILIE = 'RESILIE',
  ERREUR = 'ERREUR',
}

@Entity('raccordement_energie')
@Index(['clientId'])
@Index(['contratId'])
export class RaccordementEnergieEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'contrat_id', type: 'uuid' })
  contratId: string;

  @Column({
    type: 'enum',
    enum: PartenaireEnergie,
  })
  partenaire: PartenaireEnergie;

  @Column({
    name: 'statut_raccordement',
    type: 'enum',
    enum: StatutRaccordement,
    default: StatutRaccordement.DEMANDE_ENVOYEE,
  })
  statutRaccordement: StatutRaccordement;

  @Column({ name: 'statut_activation', type: 'varchar', length: 120, nullable: true })
  statutActivation: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  adresse: string | null;

  @Column({ name: 'pdl_pce', type: 'varchar', length: 120, nullable: true })
  pdlPce: string | null;

  @Column({ name: 'date_demande', type: 'timestamptz' })
  dateDemande: Date;

  @Column({ name: 'date_activation', type: 'timestamptz', nullable: true })
  dateActivation: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('EnergieStatusHistoryEntity', 'raccordement')
  statusHistory: any[];
}
