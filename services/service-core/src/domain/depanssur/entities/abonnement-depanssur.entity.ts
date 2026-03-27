import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ClientBaseEntity } from '../../clients/entities/client-base.entity';
import { CompteurPlafondEntity } from './compteur-plafond.entity';
import { HistoriqueStatutAbonnementEntity } from './historique-statut-abonnement.entity';
import { OptionAbonnementEntity } from './option-abonnement.entity';

@Entity('abonnement_depanssur')
export class AbonnementDepanssurEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  keycloakGroupId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => ClientBaseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: ClientBaseEntity;

  @Column({ name: 'plan_type', length: 50 })
  planType: string; // ESSENTIEL, STANDARD, PREMIUM

  @Column({ length: 50 })
  periodicite: string; // MENSUELLE, ANNUELLE

  @Column({ name: 'periode_attente', type: 'int', default: 0 })
  periodeAttente: number; // jours de carence

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  franchise: string | null; // montant fixe par dossier

  @Column({ name: 'plafond_par_intervention', type: 'decimal', precision: 12, scale: 2, nullable: true })
  plafondParIntervention: string | null;

  @Column({ name: 'plafond_annuel', type: 'decimal', precision: 12, scale: 2, nullable: true })
  plafondAnnuel: string | null;

  @Column({ name: 'nb_interventions_max', type: 'int', nullable: true })
  nbInterventionsMax: number | null;

  @Column({ length: 50, default: 'ACTIF' })
  statut: string; // ACTIF, PAUSE, SUSPENDU_IMPAYE, RESILIE

  @Column({ name: 'motif_resiliation', type: 'varchar', length: 50, nullable: true })
  motifResiliation: string | null;

  @Column({ name: 'date_souscription', type: 'timestamptz' })
  dateSouscription: Date;

  @Column({ name: 'date_effet', type: 'timestamptz' })
  dateEffet: Date;

  @Column({ name: 'date_fin', type: 'timestamptz', nullable: true })
  dateFin: Date | null;

  @Column({ name: 'prochaine_echeance', type: 'timestamptz' })
  prochaineEcheance: Date;

  @Column({ name: 'prix_ttc', type: 'decimal', precision: 12, scale: 2 })
  prixTtc: string;

  @Column({ name: 'taux_tva', type: 'decimal', precision: 5, scale: 2 })
  tauxTva: string;

  @Column({ name: 'montant_ht', type: 'decimal', precision: 12, scale: 2 })
  montantHt: string;

  @Column({ name: 'code_remise', type: 'varchar', length: 100, nullable: true })
  codeRemise: string | null;

  @Column({ name: 'montant_remise', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montantRemise: string | null;

  @OneToMany(() => OptionAbonnementEntity, (option) => option.abonnement)
  options: Relation<OptionAbonnementEntity[]>;

  @OneToMany(() => CompteurPlafondEntity, (compteur) => compteur.abonnement)
  compteurs: Relation<CompteurPlafondEntity[]>;

  @OneToMany(() => HistoriqueStatutAbonnementEntity, (historique) => historique.abonnement)
  historique: Relation<HistoriqueStatutAbonnementEntity[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
