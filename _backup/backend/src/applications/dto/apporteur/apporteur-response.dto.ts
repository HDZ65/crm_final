export class ApporteurResponseDto {
  id: string;
  organisationId: string;
  utilisateurId?: string | null;
  nom: string;
  prenom: string;
  typeApporteur: string;
  email?: string | null;
  telephone?: string | null;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ApporteurResponseDto>) {
    Object.assign(this, partial);
  }
}
