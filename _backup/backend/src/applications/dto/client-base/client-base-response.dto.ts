export class ClientBaseDto {
  id: string;
  organisationId: string;
  typeClient: string;
  nom: string;
  prenom: string;
  dateNaissance?: Date | null;
  compteCode: string;
  partenaireId: string;
  dateCreation: Date;
  telephone: string;
  email?: string;
  statut: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ClientBaseDto>) {
    Object.assign(this, partial);
  }
}

export interface ContratSummaryDto {
  id: string;
  reference: string;
  titre: string | null;
  dateDebut: string;
  dateFin: string | null;
  statut: string;
  montant: number | null;
}

export class ClientBaseWithContratsDto extends ClientBaseDto {
  contrats: ContratSummaryDto[];

  constructor(partial: Partial<ClientBaseWithContratsDto>) {
    super(partial);
    this.contrats = partial.contrats || [];
  }
}
