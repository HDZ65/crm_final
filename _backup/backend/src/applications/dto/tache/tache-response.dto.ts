export class TacheDto {
  id: string;
  organisationId: string;
  titre: string;
  description?: string;
  type: string;
  priorite: string;
  statut: string;
  dateEcheance: Date;
  dateCompletion?: Date;
  assigneA: string;
  creePar: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  regleRelanceId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  enRetard?: boolean;

  constructor(partial: Partial<TacheDto>) {
    Object.assign(this, partial);
    // Calcul du retard
    if (
      this.statut !== 'TERMINEE' &&
      this.statut !== 'ANNULEE' &&
      this.dateEcheance
    ) {
      this.enRetard = new Date() > new Date(this.dateEcheance);
    } else {
      this.enRetard = false;
    }
  }
}

export class TacheStatsDto {
  aFaire: number;
  enCours: number;
  terminee: number;
  annulee: number;
  enRetard: number;
  total: number;

  constructor(stats: Partial<TacheStatsDto>) {
    this.aFaire = stats.aFaire ?? 0;
    this.enCours = stats.enCours ?? 0;
    this.terminee = stats.terminee ?? 0;
    this.annulee = stats.annulee ?? 0;
    this.enRetard = stats.enRetard ?? 0;
    this.total = this.aFaire + this.enCours + this.terminee + this.annulee;
  }
}

export class PaginatedTachesDto {
  data: TacheDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(
    entities: TacheDto[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.data = entities;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
