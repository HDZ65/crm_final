import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DemandeCategorie {
  ADMINISTRATIVE = 'administrative',
  TECHNIQUE = 'technique',
  COMMERCIALE = 'commerciale',
  JURIDIQUE = 'juridique',
  FINANCIERE = 'financiere',
  AUTRE = 'autre',
}

export enum DemandeCanal {
  EMAIL = 'email',
  TELEPHONE = 'telephone',
  CHAT = 'chat',
  PORTAIL = 'portail',
  EN_PERSONNE = 'en_personne',
}

export enum DemandePriorite {
  BASSE = 'basse',
  NORMALE = 'normale',
  HAUTE = 'haute',
  URGENTE = 'urgente',
}

export enum DemandeStatut {
  NOUVELLE = 'nouvelle',
  EN_COURS = 'en_cours',
  EN_ATTENTE = 'en_attente',
  RESOLUE = 'resolue',
  FERMEE = 'fermee',
  ANNULEE = 'annulee',
}

@Entity('demande_conciergerie')
export class DemandeConciergerie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id' })
  organisationId: string;

  @Column({ name: 'client_id' })
  clientId: string;

  @Column({ name: 'reference', unique: true })
  reference: string;

  @Column()
  objet: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DemandeCategorie,
    default: DemandeCategorie.AUTRE,
  })
  categorie: DemandeCategorie;

  @Column({
    type: 'enum',
    enum: DemandeCanal,
    default: DemandeCanal.PORTAIL,
  })
  canal: DemandeCanal;

  @Column({
    type: 'enum',
    enum: DemandePriorite,
    default: DemandePriorite.NORMALE,
  })
  priorite: DemandePriorite;

  @Column({
    type: 'enum',
    enum: DemandeStatut,
    default: DemandeStatut.NOUVELLE,
  })
  statut: DemandeStatut;

  @Column({ name: 'assigne_a', nullable: true })
  assigneA: string;

  @Column({ name: 'cree_par', nullable: true })
  creePar: string;

  @Column({ name: 'date_limite', type: 'timestamp with time zone', nullable: true })
  dateLimite: Date;

  @Column({ name: 'date_resolution', type: 'timestamp with time zone', nullable: true })
  dateResolution: Date;

  @Column({ name: 'sla_respected', type: 'boolean', nullable: true })
  slaRespected: boolean;

  @Column({ name: 'satisfaction_score', type: 'integer', nullable: true })
  satisfactionScore: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
