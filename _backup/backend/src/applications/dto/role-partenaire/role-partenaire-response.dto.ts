export class RolePartenaireDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RolePartenaireDto>) {
    Object.assign(this, partial);
  }
}
