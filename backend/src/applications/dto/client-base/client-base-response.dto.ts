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
  statutId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ClientBaseDto>) {
    Object.assign(this, partial);
  }
}

export interface ContratSummaryDto {
  id: string;
  referenceExterne: string;
  dateDebut: string;
  dateFin: string;
  statutId: string;
  societeId: string;
}

export class ClientBaseWithContratsDto extends ClientBaseDto {
  contrats: ContratSummaryDto[];

  constructor(partial: Partial<ClientBaseWithContratsDto>) {
    super(partial);
    this.contrats = partial.contrats || [];
  }
}
