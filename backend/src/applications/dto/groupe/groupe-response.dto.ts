export class GroupeDto {
  id: string;
  organisationId: string;
  nom: string;
  description?: string | null;
  type: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<GroupeDto>) {
    Object.assign(this, partial);
  }
}
