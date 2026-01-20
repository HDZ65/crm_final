export class AdresseDto {
  id: string;
  clientBaseId: string;
  ligne1: string;
  ligne2?: string | null;
  codePostal: string;
  ville: string;
  pays: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<AdresseDto>) {
    Object.assign(this, partial);
  }
}
