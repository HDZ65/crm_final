export class GroupeEntiteDto {
  id: string;
  groupeId: string;
  entiteId: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<GroupeEntiteDto>) {
    Object.assign(this, partial);
  }
}

export class GroupeEntiteWithDetailsDto {
  id: string;
  groupeId: string;
  groupe?: {
    id: string;
    nom: string;
    description?: string;
    type: string;
  };
  entiteId: string;
  entite?: {
    id: string;
    raisonSociale: string;
    siren: string;
    numeroTVA: string;
  };
  type?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<GroupeEntiteWithDetailsDto>) {
    Object.assign(this, partial);
  }
}
