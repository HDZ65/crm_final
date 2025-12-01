export class MembreCompteDto {
  id: string;
  organisationId: string;
  utilisateurId: string;
  roleId: string;
  etat: string;
  dateInvitation?: string | null;
  dateActivation?: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<MembreCompteDto>) {
    Object.assign(this, partial);
  }
}

export class MembreCompteWithUserDto {
  id: string;
  organisationId: string;
  utilisateurId: string;
  roleId: string;
  etat: string;
  dateInvitation?: string | null;
  dateActivation?: string | null;
  createdAt: Date;
  updatedAt: Date;
  utilisateur: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
  };

  constructor(partial: Partial<MembreCompteWithUserDto>) {
    Object.assign(this, partial);
  }
}
