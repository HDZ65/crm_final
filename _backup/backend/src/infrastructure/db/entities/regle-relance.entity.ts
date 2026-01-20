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

@Entity('regles_relance')
@Index(['organisationId', 'actif'])
@Index(['organisationId', 'declencheur'])
export class RegleRelanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column()
  nom: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  declencheur: string;

  @Column({ type: 'int' })
  delaiJours: number;

  @Column()
  actionType: string;

  @Column({ default: 'MOYENNE' })
  prioriteTache: string;

  @Column({ nullable: true })
  templateEmailId?: string;

  @Column({ nullable: true })
  templateTitreTache?: string;

  @Column({ type: 'text', nullable: true })
  templateDescriptionTache?: string;

  @Column({ nullable: true })
  assigneParDefaut?: string;

  @ManyToOne(() => UtilisateurEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigneParDefaut' })
  assigneUtilisateur: UtilisateurEntity;

  @Column({ default: true })
  actif: boolean;

  @Column({ type: 'int', default: 1 })
  ordre: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
