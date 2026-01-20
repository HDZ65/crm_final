export class ExpeditionDto {
  id: string;
  organisationId: string;
  clientBaseId: string;
  contratId?: string | null;
  transporteurCompteId: string;
  trackingNumber: string;
  etat: string;
  dateCreation: Date | string;
  dateDernierStatut: Date | string;
  labelUrl: string;
  // Nouveaux champs pour le suivi des expéditions
  referenceCommande: string;
  produitId?: string | null;
  nomProduit?: string | null;
  poids?: number | null;
  adresseDestination?: string | null;
  villeDestination?: string | null;
  codePostalDestination?: string | null;
  dateExpedition?: Date | string | null;
  dateLivraisonEstimee?: Date | string | null;
  dateLivraison?: Date | string | null;
  lieuActuel?: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ExpeditionDto>) {
    Object.assign(this, partial);
  }
}
