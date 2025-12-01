export class FacturationParDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<FacturationParDto>) {
    Object.assign(this, partial);
  }
}
