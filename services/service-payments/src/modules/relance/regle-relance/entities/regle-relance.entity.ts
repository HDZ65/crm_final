import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { HistoriqueRelanceEntity } from '../../historique-relance/entities/historique-relance.entity';

export enum RelanceDeclencheur {
  IMPAYE = 'IMPAYE',
  CONTRAT_BIENTOT_EXPIRE = 'CONTRAT_BIENTOT_EXPIRE',
  CONTRAT_EXPIRE = 'CONTRAT_EXPIRE',
  NOUVEAU_CLIENT = 'NOUVEAU_CLIENT',
  INACTIVITE_CLIENT = 'INACTIVITE_CLIENT',
}

export enum RelanceActionType {
  CREER_TACHE = 'CREER_TACHE',
  ENVOYER_EMAIL = 'ENVOYER_EMAIL',
  NOTIFICATION = 'NOTIFICATION',
  TACHE_ET_EMAIL = 'TACHE_ET_EMAIL',
}

export enum Priorite {
  HAUTE = 'HAUTE',
  MOYENNE = 'MOYENNE',
  BASSE = 'BASSE',
}

@Entity('regle_relance')
@Index(['organisationId', 'declencheur'])
@Index(['organisationId', 'actif'])
export class RegleRelanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ length: 100 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: RelanceDeclencheur,
  })
  declencheur: RelanceDeclencheur;

  @Column({ name: 'delai_jours', type: 'int' })
  delaiJours: number;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: RelanceActionType,
  })
  actionType: RelanceActionType;

  @Column({
    name: 'priorite_tache',
    type: 'enum',
    enum: Priorite,
    default: Priorite.MOYENNE,
  })
  prioriteTache: Priorite;

  @Column({ name: 'template_email_id', type: 'uuid', nullable: true })
  templateEmailId: string | null;

  @Column({ name: 'template_titre_tache', type: 'text', nullable: true })
  templateTitreTache: string | null;

  @Column({ name: 'template_description_tache', type: 'text', nullable: true })
  templateDescriptionTache: string | null;

  @Column({ name: 'assigne_par_defaut', type: 'uuid', nullable: true })
  assigneParDefaut: string | null;

  @Column({ default: true })
  actif: boolean;

  @Column({ type: 'int', default: 1 })
  ordre: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => HistoriqueRelanceEntity, (historique) => historique.regle)
  historiques: HistoriqueRelanceEntity[];
}
