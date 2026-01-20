import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrganisationEntity } from './organisation.entity';
import { UtilisateurEntity } from './utilisateur.entity';
import { ClientBaseEntity } from './client-base.entity';
import { ContratEntity } from './contrat.entity';
import { FactureEntity } from './facture.entity';

@Entity('taches')
@Index(['organisationId', 'statut'])
@Index(['assigneA', 'dateEcheance'])
@Index(['organisationId', 'dateEcheance'])
export class TacheEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column()
  titre: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  type: string;

  @Column()
  priorite: string;

  @Column({ default: 'A_FAIRE' })
  statut: string;

  @Column({ type: 'timestamp' })
  dateEcheance: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateCompletion?: Date;

  @Column()
  assigneA: string;

  @ManyToOne(() => UtilisateurEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigneA' })
  assigneUtilisateur: UtilisateurEntity;

  @Column()
  creePar: string;

  @ManyToOne(() => UtilisateurEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'creePar' })
  createurUtilisateur: UtilisateurEntity;

  @Column({ nullable: true })
  clientId?: string;

  @ManyToOne(() => ClientBaseEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: ClientBaseEntity;

  @Column({ nullable: true })
  contratId?: string;

  @ManyToOne(() => ContratEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'contratId' })
  contrat: ContratEntity;

  @Column({ nullable: true })
  factureId?: string;

  @ManyToOne(() => FactureEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'factureId' })
  facture: FactureEntity;

  @Column({ nullable: true })
  regleRelanceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
