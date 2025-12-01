import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LigneContratEntity } from './ligne-contrat.entity';
import { HistoriqueStatutContratEntity } from './historique-statut-contrat.entity';
import { OrganisationEntity } from './organisation.entity';
import { ClientBaseEntity } from './client-base.entity';
import { ConditionPaiementEntity } from './condition-paiement.entity';
import { ModeleDistributionEntity } from './modele-distribution.entity';
import { FacturationParEntity } from './facturation-par.entity';
import { ClientPartenaireEntity } from './client-partenaire.entity';
import { UtilisateurEntity } from './utilisateur.entity';
import { AdresseEntity } from './adresse.entity';
import { SocieteEntity } from './societe.entity';

@Entity('contrats')
export class ContratEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column()
  referenceExterne: string;

  @Column()
  dateSignature: string;

  @Column()
  dateDebut: string;

  @Column()
  dateFin: string;

  @Column()
  statutId: string;

  @Column()
  autoRenouvellement: boolean;

  @Column()
  joursPreavis: number;

  @Column()
  conditionPaiementId: string;

  @ManyToOne(() => ConditionPaiementEntity)
  @JoinColumn({ name: 'conditionPaiementId' })
  conditionPaiement: ConditionPaiementEntity;

  @Column()
  modeleDistributionId: string;

  @ManyToOne(() => ModeleDistributionEntity)
  @JoinColumn({ name: 'modeleDistributionId' })
  modeleDistribution: ModeleDistributionEntity;

  @Column()
  facturationParId: string;

  @ManyToOne(() => FacturationParEntity)
  @JoinColumn({ name: 'facturationParId' })
  facturationPar: FacturationParEntity;

  @Column()
  clientBaseId: string;

  @ManyToOne(() => ClientBaseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientBaseId' })
  client: ClientBaseEntity;

  @Column()
  societeId: string;

  @ManyToOne(() => SocieteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'societeId' })
  societe: SocieteEntity;

  @Column()
  commercialId: string;

  @ManyToOne(() => UtilisateurEntity)
  @JoinColumn({ name: 'commercialId' })
  commercial: UtilisateurEntity;

  @Column()
  clientPartenaireId: string;

  @ManyToOne(() => ClientPartenaireEntity)
  @JoinColumn({ name: 'clientPartenaireId' })
  clientPartenaire: ClientPartenaireEntity;

  @Column()
  adresseFacturationId: string;

  @ManyToOne(() => AdresseEntity)
  @JoinColumn({ name: 'adresseFacturationId' })
  adresseFacturation: AdresseEntity;

  @Column()
  dateFinRetractation: string;

  @OneToMany(() => LigneContratEntity, (ligneContrat) => ligneContrat.contrat)
  lignesContrat: LigneContratEntity[];

  @OneToMany(
    () => HistoriqueStatutContratEntity,
    (historique) => historique.contrat,
  )
  historiquesStatut: HistoriqueStatutContratEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
