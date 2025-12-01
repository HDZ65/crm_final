export class RoleDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RoleDto>) {
    Object.assign(this, partial);
  }
}
