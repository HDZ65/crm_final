export class FactureClientDto {
  id: string;
  nom: string;
  prenom: string;
}

export class FactureStatutDto {
  id: string;
  code: string;
  nom: string;
  description?: string;
  ordreAffichage: number;
}

export class FactureDto {
  id: string;
  organisationId: string;
  numero: string | null;
  dateEmission: string;
  montantHT: number;
  montantTTC: number;
  statutId: string;
  emissionFactureId: string;
  clientBaseId: string;
  contratId?: string | null;
  clientPartenaireId: string;
  adresseFacturationId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations optionnelles
  client?: FactureClientDto;
  statut?: FactureStatutDto;

  constructor(partial: Partial<FactureDto>) {
    Object.assign(this, partial);
  }
}
