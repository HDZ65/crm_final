export class RegleRelanceDto {
  id: string;
  organisationId: string;
  nom: string;
  description?: string;
  declencheur: string;
  delaiJours: number;
  actionType: string;
  prioriteTache: string;
  templateEmailId?: string;
  templateTitreTache?: string;
  templateDescriptionTache?: string;
  assigneParDefaut?: string;
  actif: boolean;
  ordre: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RegleRelanceDto>) {
    Object.assign(this, partial);
  }
}
