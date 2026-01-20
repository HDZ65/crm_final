export class ModeleDistributionDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ModeleDistributionDto>) {
    Object.assign(this, partial);
  }
}
