export class SocieteDto {
  id: string;
  organisationId: string;
  raisonSociale: string;
  siren: string;
  numeroTVA: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<SocieteDto>) {
    Object.assign(this, partial);
  }
}
