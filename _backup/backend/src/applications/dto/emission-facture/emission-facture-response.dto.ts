export class EmissionFactureDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<EmissionFactureDto>) {
    Object.assign(this, partial);
  }
}
