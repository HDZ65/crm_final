export class ConditionPaiementDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  delaiJours: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ConditionPaiementDto>) {
    Object.assign(this, partial);
  }
}
