export class TransporteurCompteDto {
  id: string;
  type: string;
  organisationId: string;
  contractNumber: string;
  password: string;
  labelFormat: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<TransporteurCompteDto>) {
    Object.assign(this, partial);
  }
}
