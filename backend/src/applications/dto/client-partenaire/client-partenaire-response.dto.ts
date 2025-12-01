export class ClientPartenaireDto {
  id: string;
  clientBaseId: string;
  partenaireId: string;
  rolePartenaireId: string;
  validFrom: string;
  validTo: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ClientPartenaireDto>) {
    Object.assign(this, partial);
  }
}
