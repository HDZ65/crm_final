export class PartenaireMarqueBlancheDto {
  id: string;
  denomination: string;
  siren: string;
  numeroTVA: string;
  contactSupportEmail: string;
  telephone: string;
  statutId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PartenaireMarqueBlancheDto>) {
    Object.assign(this, partial);
  }
}
