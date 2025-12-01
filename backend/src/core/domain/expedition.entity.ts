import { BaseEntity } from './base.entity';

export interface ExpeditionProps {
  id?: string;
  organisationId: string;
  clientBaseId: string;
  contratId?: string | null;
  transporteurCompteId: string;
  trackingNumber: string;
  etat: string;
  dateCreation: Date;
  dateDernierStatut: Date;
  labelUrl: string;
  // Nouveaux champs pour le suivi des expéditions
  referenceCommande: string;
  produitId?: string | null;
  nomProduit?: string | null;
  poids?: number | null;
  adresseDestination?: string | null;
  villeDestination?: string | null;
  codePostalDestination?: string | null;
  dateExpedition?: Date | null;
  dateLivraisonEstimee?: Date | null;
  dateLivraison?: Date | null;
  lieuActuel?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ExpeditionEntity extends BaseEntity {
  organisationId: string;
  clientBaseId: string;
  contratId?: string | null;
  transporteurCompteId: string;
  trackingNumber: string;
  etat: string;
  dateCreation: Date;
  dateDernierStatut: Date;
  labelUrl: string;
  // Nouveaux champs pour le suivi des expéditions
  referenceCommande: string;
  produitId?: string | null;
  nomProduit?: string | null;
  poids?: number | null;
  adresseDestination?: string | null;
  villeDestination?: string | null;
  codePostalDestination?: string | null;
  dateExpedition?: Date | null;
  dateLivraisonEstimee?: Date | null;
  dateLivraison?: Date | null;
  lieuActuel?: string | null;

  constructor(props: ExpeditionProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.clientBaseId = props.clientBaseId;
    this.contratId = props.contratId;
    this.transporteurCompteId = props.transporteurCompteId;
    this.trackingNumber = props.trackingNumber;
    this.etat = props.etat;
    this.dateCreation = props.dateCreation;
    this.dateDernierStatut = props.dateDernierStatut;
    this.labelUrl = props.labelUrl;
    // Nouveaux champs
    this.referenceCommande = props.referenceCommande;
    this.produitId = props.produitId;
    this.nomProduit = props.nomProduit;
    this.poids = props.poids;
    this.adresseDestination = props.adresseDestination;
    this.villeDestination = props.villeDestination;
    this.codePostalDestination = props.codePostalDestination;
    this.dateExpedition = props.dateExpedition;
    this.dateLivraisonEstimee = props.dateLivraisonEstimee;
    this.dateLivraison = props.dateLivraison;
    this.lieuActuel = props.lieuActuel;
  }

  isDelivered(): boolean {
    return this.etat === 'livre' || this.etat === 'delivered';
  }

  isInTransit(): boolean {
    return this.etat === 'en_transit' || this.etat === 'in_transit';
  }

  isDelayed(): boolean {
    if (!this.dateLivraisonEstimee) return false;
    return new Date() > this.dateLivraisonEstimee && !this.isDelivered();
  }
}
