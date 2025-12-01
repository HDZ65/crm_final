export class FactureDto {
  id: string;
  organisationId: string;
  numero: string;
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

  constructor(partial: Partial<FactureDto>) {
    Object.assign(this, partial);
  }
}
