export class MembreGroupeDto {
  id: string;
  membreCompteId: string;
  groupeId: string;
  roleLocal: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<MembreGroupeDto>) {
    Object.assign(this, partial);
  }
}
