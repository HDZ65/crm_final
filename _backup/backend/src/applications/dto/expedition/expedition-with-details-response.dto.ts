export class ClientSummaryDto {
  id: string;
  nom: string;
  prenom: string;
  entreprise?: string | null;
  email?: string | null;

  constructor(partial: Partial<ClientSummaryDto>) {
    Object.assign(this, partial);
  }
}

export class ContratSummaryDto {
  id: string;
  referenceExterne: string;

  constructor(partial: Partial<ContratSummaryDto>) {
    Object.assign(this, partial);
  }
}

export class TransporteurSummaryDto {
  id: string;
  type: string;

  constructor(partial: Partial<TransporteurSummaryDto>) {
    Object.assign(this, partial);
  }
}

export class ExpeditionWithDetailsDto {
  id: string;
  organisationId: string;
  referenceCommande: string;
  trackingNumber: string;
  etat: string;
  nomProduit?: string | null;
  poids?: number | null;
  villeDestination?: string | null;
  codePostalDestination?: string | null;
  adresseDestination?: string | null;
  dateCreation: Date | string;
  dateExpedition?: Date | string | null;
  dateLivraisonEstimee?: Date | string | null;
  dateLivraison?: Date | string | null;
  dateDernierStatut: Date | string;
  lieuActuel?: string | null;
  labelUrl: string;
  // Relations enrichies
  client: ClientSummaryDto | null;
  contrat: ContratSummaryDto | null;
  transporteur: TransporteurSummaryDto | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ExpeditionWithDetailsDto>) {
    Object.assign(this, partial);
  }
}
