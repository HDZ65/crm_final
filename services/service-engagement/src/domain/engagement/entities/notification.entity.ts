import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  CONTRAT_EXPIRE = 'CONTRAT_EXPIRE',
  CONTRAT_BIENTOT_EXPIRE = 'CONTRAT_BIENTOT_EXPIRE',
  IMPAYE = 'IMPAYE',
  NOUVEAU_CLIENT = 'NOUVEAU_CLIENT',
  NOUVEAU_CONTRAT = 'NOUVEAU_CONTRAT',
  TACHE_ASSIGNEE = 'TACHE_ASSIGNEE',
  RAPPEL = 'RAPPEL',
  ALERTE = 'ALERTE',
  INFO = 'INFO',
  SYSTEME = 'SYSTEME',
}

@Entity('notifications')
@Index(['utilisateurId', 'lu'])
@Index(['organisationId', 'createdAt'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'utilisateur_id', type: 'uuid' })
  @Index()
  utilisateurId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  titre: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  lu: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'lien_url', type: 'varchar', length: 500, nullable: true })
  lienUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
