export class AffectationGroupeClientDto {
  id: string;
  groupeId: string;
  clientBaseId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<AffectationGroupeClientDto>) {
    Object.assign(this, partial);
  }
}
