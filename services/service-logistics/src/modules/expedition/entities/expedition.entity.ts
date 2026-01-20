import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('expeditions')
export class ExpeditionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id' })
  @Index()
  organisationId: string;

  @Column({ name: 'client_base_id' })
  @Index()
  clientBaseId: string;

  @Column({ name: 'contrat_id', type: 'uuid', nullable: true })
  contratId: string | null;

  @Column({ name: 'transporteur_compte_id' })
  @Index()
  transporteurCompteId: string;

  @Column({ name: 'tracking_number' })
  @Index()
  trackingNumber: string;

  @Column()
  etat: string;

  @Column({ name: 'date_creation', type: 'timestamptz' })
  dateCreation: Date;

  @Column({ name: 'date_dernier_statut', type: 'timestamptz' })
  dateDernierStatut: Date;

  @Column({ name: 'label_url' })
  labelUrl: string;

  @Column({ name: 'reference_commande' })
  referenceCommande: string;

  @Column({ name: 'produit_id', type: 'uuid', nullable: true })
  produitId: string | null;

  @Column({ name: 'nom_produit', type: 'varchar', nullable: true })
  nomProduit: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  poids: number | null;

  @Column({ name: 'adresse_destination', type: 'varchar', nullable: true })
  adresseDestination: string | null;

  @Column({ name: 'ville_destination', type: 'varchar', nullable: true })
  villeDestination: string | null;

  @Column({ name: 'code_postal_destination', type: 'varchar', nullable: true })
  codePostalDestination: string | null;

  @Column({ name: 'date_expedition', type: 'timestamptz', nullable: true })
  dateExpedition: Date | null;

  @Column({ name: 'date_livraison_estimee', type: 'timestamptz', nullable: true })
  dateLivraisonEstimee: Date | null;

  @Column({ name: 'date_livraison', type: 'timestamptz', nullable: true })
  dateLivraison: Date | null;

  @Column({ name: 'lieu_actuel', type: 'varchar', nullable: true })
  lieuActuel: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isDelivered(): boolean {
    return this.etat === 'delivered' || this.etat === 'livré';
  }

  isInTransit(): boolean {
    return this.etat === 'in_transit' || this.etat === 'en_cours';
  }
}
