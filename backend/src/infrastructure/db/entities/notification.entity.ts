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

@Entity('notifications')
@Index(['utilisateurId', 'lu'])
@Index(['organisationId', 'createdAt'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column()
  utilisateurId: string;

  @ManyToOne(() => UtilisateurEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'utilisateurId' })
  utilisateur: UtilisateurEntity;

  @Column()
  type: string;

  @Column()
  titre: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  lu: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  lienUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
