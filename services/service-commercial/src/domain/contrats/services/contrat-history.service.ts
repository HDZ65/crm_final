import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DomainException } from '@crm/shared-kernel';
import { Repository } from 'typeorm';
import { ContratStatus } from '../entities/contrat-status.enum';
import { HistoriqueStatutContratEntity } from '../entities/historique-statut-contrat.entity';
import { StatutContratEntity } from '../entities/statut-contrat.entity';

export interface CreateContratHistoryInput {
  contratId: string;
  ancienStatut: ContratStatus;
  nouveauStatut: ContratStatus;
  dateChangement: string;
}

@Injectable()
export class ContratHistoryService {
  private readonly statusCodeCache: Map<string, string> = new Map();

  constructor(
    @InjectRepository(StatutContratEntity)
    private readonly statutRepo: Repository<StatutContratEntity>,
    @InjectRepository(HistoriqueStatutContratEntity)
    private readonly historyRepo: Repository<HistoriqueStatutContratEntity>,
  ) {}

  private async resolveStatusId(code: string): Promise<string> {
    const cached = this.statusCodeCache.get(code);
    if (cached) {
      return cached;
    }

    const statut = await this.statutRepo.findOne({ where: { code } });
    if (!statut) {
      throw new DomainException(
        `Statut contrat ${code} not found`,
        'STATUT_CONTRAT_NOT_FOUND',
        { code },
      );
    }

    this.statusCodeCache.set(code, statut.id);
    return statut.id;
  }

  async create(input: CreateContratHistoryInput): Promise<HistoriqueStatutContratEntity> {
    const ancienStatutId = await this.resolveStatusId(input.ancienStatut);
    const nouveauStatutId = await this.resolveStatusId(input.nouveauStatut);

    const history = new HistoriqueStatutContratEntity();
    history.contratId = input.contratId;
    history.ancienStatutId = ancienStatutId;
    history.nouveauStatutId = nouveauStatutId;
    history.dateChangement = input.dateChangement;

    return this.historyRepo.save(history);
  }

  async findByContrat(contratId: string): Promise<HistoriqueStatutContratEntity[]> {
    return this.historyRepo.find({
      where: { contratId },
      order: { dateChangement: 'DESC' },
    });
  }
}
