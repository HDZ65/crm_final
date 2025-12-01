export class UtilisateurDto {
  id: string;
  keycloakId?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UtilisateurDto>) {
    Object.assign(this, partial);
  }
}
