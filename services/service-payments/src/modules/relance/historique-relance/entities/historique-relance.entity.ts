import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RegleRelanceEntity } from '../../regle-relance/entities/regle-relance.entity';

export enum RelanceResultat {
  SUCCES = 'SUCCES',
  ECHEC = 'ECHEC',
  IGNORE = 'IGNORE',
}

@Entity('historique_relance')
@Index(['organisationId', 'dateExecution'])
@Index(['regleRelanceId', 'dateExecution'])
export class HistoriqueRelanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'regle_relance_id', type: 'uuid' })
  @Index()
  regleRelanceId: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  @Index()
  clientId: string | null;

  @Column({ name: 'contrat_id', type: 'uuid', nullable: true })
  @Index()
  contratId: string | null;

  @Column({ name: 'facture_id', type: 'uuid', nullable: true })
  @Index()
  factureId: string | null;

  @Column({ name: 'tache_creee_id', type: 'uuid', nullable: true })
  tacheCreeeId: string | null;

  @Column({ name: 'date_execution', type: 'timestamp' })
  @Index()
  dateExecution: Date;

  @Column({
    type: 'enum',
    enum: RelanceResultat,
  })
  resultat: RelanceResultat;

  @Column({ name: 'message_erreur', type: 'text', nullable: true })
  messageErreur: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => RegleRelanceEntity, (regle) => regle.historiques)
  @JoinColumn({ name: 'regle_relance_id' })
  regle: RegleRelanceEntity;
}
