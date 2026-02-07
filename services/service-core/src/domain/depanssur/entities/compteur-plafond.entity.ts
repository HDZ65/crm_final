import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AbonnementDepanssurEntity } from './abonnement-depanssur.entity';

@Entity('compteur_plafond')
export class CompteurPlafondEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'abonnement_id', type: 'uuid' })
  abonnementId: string;

  @ManyToOne(() => AbonnementDepanssurEntity, (a) => a.compteurs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'abonnement_id' })
  abonnement: AbonnementDepanssurEntity;

  @Column({ name: 'annee_glissante_debut', type: 'timestamptz' })
  anneeGlissanteDebut: Date;

  @Column({ name: 'annee_glissante_fin', type: 'timestamptz' })
  anneeGlissanteFin: Date;

  @Column({ name: 'nb_interventions_utilisees', type: 'int', default: 0 })
  nbInterventionsUtilisees: number;

  @Column({ name: 'montant_cumule', type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantCumule: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
