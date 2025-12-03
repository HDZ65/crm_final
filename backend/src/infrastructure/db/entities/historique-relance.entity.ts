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
import { RegleRelanceEntity } from './regle-relance.entity';
import { ClientBaseEntity } from './client-base.entity';
import { ContratEntity } from './contrat.entity';
import { FactureEntity } from './facture.entity';
import { TacheEntity } from './tache.entity';

@Entity('historique_relances')
@Index(['organisationId', 'dateExecution'])
@Index(['regleRelanceId', 'dateExecution'])
export class HistoriqueRelanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column()
  regleRelanceId: string;

  @ManyToOne(() => RegleRelanceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'regleRelanceId' })
  regleRelance: RegleRelanceEntity;

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
  tacheCreeeId?: string;

  @ManyToOne(() => TacheEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'tacheCreeeId' })
  tacheCreee: TacheEntity;

  @Column({ type: 'timestamp' })
  dateExecution: Date;

  @Column()
  resultat: string;

  @Column({ type: 'text', nullable: true })
  messageErreur?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
