export class ClientEntrepriseDto {
  id: string;
  raisonSociale: string;
  numeroTVA: string;
  siren: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ClientEntrepriseDto>) {
    Object.assign(this, partial);
  }
}
