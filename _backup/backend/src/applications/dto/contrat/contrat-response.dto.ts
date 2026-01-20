export class ContratDto {
  id: string;
  organisationId: string;
  reference: string;
  titre: string | null;
  description: string | null;
  type: string | null;
  statut: string;
  dateDebut: string;
  dateFin: string | null;
  dateSignature: string | null;
  montant: number | null;
  devise: string | null;
  frequenceFacturation: string | null;
  documentUrl: string | null;
  fournisseur: string | null;
  clientId: string;
  commercialId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ContratDto>) {
    Object.assign(this, partial);
  }
}
