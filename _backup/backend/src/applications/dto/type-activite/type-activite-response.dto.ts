export class TypeActiviteDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<TypeActiviteDto>) {
    Object.assign(this, partial);
  }
}
