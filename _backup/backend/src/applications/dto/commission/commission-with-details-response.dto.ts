export class ApporteurSummaryDto {
  id: string;
  nom: string;
  prenom: string;
  typeApporteur: string;

  constructor(partial: Partial<ApporteurSummaryDto>) {
    Object.assign(this, partial);
  }
}

export class ContratSummaryDto {
  id: string;
  referenceExterne: string;
  clientNom?: string | null;

  constructor(partial: Partial<ContratSummaryDto>) {
    Object.assign(this, partial);
  }
}

export class ProduitSummaryDto {
  id: string;
  nom: string;
  sku: string;

  constructor(partial: Partial<ProduitSummaryDto>) {
    Object.assign(this, partial);
  }
}

export class StatutSummaryDto {
  id: string;
  code: string;
  nom: string;

  constructor(partial: Partial<StatutSummaryDto>) {
    Object.assign(this, partial);
  }
}

export class CommissionWithDetailsResponseDto {
  id: string;
  organisationId: string;
  reference: string;
  compagnie: string;
  typeBase: string;
  montantBrut: number;
  montantReprises: number;
  montantAcomptes: number;
  montantNetAPayer: number;
  periode: string;
  dateCreation: Date | string;
  apporteur: ApporteurSummaryDto | null;
  contrat: ContratSummaryDto | null;
  produit: ProduitSummaryDto | null;
  statut: StatutSummaryDto | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<CommissionWithDetailsResponseDto>) {
    Object.assign(this, partial);
  }
}
