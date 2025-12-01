import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContratEntity } from './contrat.entity';
import { ProduitEntity } from './produit.entity';
import { ClientBaseEntity } from './client-base.entity';
import { TransporteurCompteEntity } from './transporteur-compte.entity';

@Entity('expeditions')
export class ExpeditionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @Column()
  clientBaseId: string;

  @ManyToOne(() => ClientBaseEntity, { nullable: true })
  @JoinColumn({ name: 'clientBaseId' })
  clientBase: ClientBaseEntity | null;

  @Column({ type: 'uuid', nullable: true })
  contratId: string | null;

  @ManyToOne(() => ContratEntity, { nullable: true })
  @JoinColumn({ name: 'contratId' })
  contrat: ContratEntity | null;

  @Column()
  transporteurCompteId: string;

  @ManyToOne(() => TransporteurCompteEntity, { nullable: true })
  @JoinColumn({ name: 'transporteurCompteId' })
  transporteurCompte: TransporteurCompteEntity | null;

  @Column()
  trackingNumber: string;

  @Column()
  etat: string;

  @Column({ type: 'timestamptz' })
  dateCreation: Date;

  @Column({ type: 'timestamptz' })
  dateDernierStatut: Date;

  @Column()
  labelUrl: string;

  // Nouveaux champs pour le suivi des expéditions
  @Column()
  referenceCommande: string;

  @Column({ type: 'uuid', nullable: true })
  produitId: string | null;

  @ManyToOne(() => ProduitEntity, { nullable: true })
  @JoinColumn({ name: 'produitId' })
  produit: ProduitEntity | null;

  @Column({ type: 'varchar', nullable: true })
  nomProduit: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  poids: number | null;

  @Column({ type: 'varchar', nullable: true })
  adresseDestination: string | null;

  @Column({ type: 'varchar', nullable: true })
  villeDestination: string | null;

  @Column({ type: 'varchar', nullable: true })
  codePostalDestination: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  dateExpedition: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  dateLivraisonEstimee: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  dateLivraison: Date | null;

  @Column({ type: 'varchar', nullable: true })
  lieuActuel: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
