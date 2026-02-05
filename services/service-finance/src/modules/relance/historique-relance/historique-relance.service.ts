import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { HistoriqueRelanceEntity, RelanceResultat } from './entities/historique-relance.entity';

interface CreateHistoriqueRelanceInput {
  organisationId: string;
  regleRelanceId: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  tacheCreeeId?: string;
  resultat: RelanceResultat;
  messageErreur?: string;
  metadata?: string;
}

interface ListHistoriquesRelanceInput {
  organisationId: string;
  regleRelanceId?: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  resultat?: RelanceResultat;
  dateFrom?: Date;
  dateTo?: Date;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  };
}

@Injectable()
export class HistoriqueRelanceService {
  private readonly logger = new Logger(HistoriqueRelanceService.name);

  constructor(
    @InjectRepository(HistoriqueRelanceEntity)
    private readonly historiqueRepository: Repository<HistoriqueRelanceEntity>,
  ) {}

  async create(input: CreateHistoriqueRelanceInput): Promise<HistoriqueRelanceEntity> {
    this.logger.log(`Creating historique relance for regle ${input.regleRelanceId}`);

    let metadata: Record<string, unknown> | null = null;
    if (input.metadata) {
      try {
        metadata = JSON.parse(input.metadata);
      } catch {
        metadata = null;
      }
    }

    const historique = this.historiqueRepository.create({
      organisationId: input.organisationId,
      regleRelanceId: input.regleRelanceId,
      clientId: input.clientId || null,
      contratId: input.contratId || null,
      factureId: input.factureId || null,
      tacheCreeeId: input.tacheCreeeId || null,
      dateExecution: new Date(),
      resultat: input.resultat,
      messageErreur: input.messageErreur || null,
      metadata,
    });

    return this.historiqueRepository.save(historique);
  }

  async findById(id: string): Promise<HistoriqueRelanceEntity> {
    const historique = await this.historiqueRepository.findOne({
      where: { id },
      relations: ['regle'],
    });

    if (!historique) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Historique relance ${id} not found`,
      });
    }

    return historique;
  }

  async findAll(input: ListHistoriquesRelanceInput): Promise<{
    historiques: HistoriqueRelanceEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sortBy || 'dateExecution';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const queryBuilder = this.historiqueRepository
      .createQueryBuilder('historique')
      .leftJoinAndSelect('historique.regle', 'regle')
      .where('historique.organisationId = :organisationId', {
        organisationId: input.organisationId,
      });

    if (input.regleRelanceId) {
      queryBuilder.andWhere('historique.regleRelanceId = :regleRelanceId', {
        regleRelanceId: input.regleRelanceId,
      });
    }

    if (input.clientId) {
      queryBuilder.andWhere('historique.clientId = :clientId', { clientId: input.clientId });
    }

    if (input.contratId) {
      queryBuilder.andWhere('historique.contratId = :contratId', { contratId: input.contratId });
    }

    if (input.factureId) {
      queryBuilder.andWhere('historique.factureId = :factureId', { factureId: input.factureId });
    }

    if (input.resultat) {
      queryBuilder.andWhere('historique.resultat = :resultat', { resultat: input.resultat });
    }

    if (input.dateFrom) {
      queryBuilder.andWhere('historique.dateExecution >= :dateFrom', { dateFrom: input.dateFrom });
    }

    if (input.dateTo) {
      queryBuilder.andWhere('historique.dateExecution <= :dateTo', { dateTo: input.dateTo });
    }

    const [historiques, total] = await queryBuilder
      .orderBy(`historique.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      historiques,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.historiqueRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async existsForToday(
    regleRelanceId: string,
    clientId?: string,
    contratId?: string,
    factureId?: string,
  ): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queryBuilder = this.historiqueRepository
      .createQueryBuilder('historique')
      .where('historique.regleRelanceId = :regleRelanceId', { regleRelanceId })
      .andWhere('historique.dateExecution >= :today', { today })
      .andWhere('historique.dateExecution < :tomorrow', { tomorrow });

    if (clientId) {
      queryBuilder.andWhere('historique.clientId = :clientId', { clientId });
    }

    if (contratId) {
      queryBuilder.andWhere('historique.contratId = :contratId', { contratId });
    }

    if (factureId) {
      queryBuilder.andWhere('historique.factureId = :factureId', { factureId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  async getStatistiques(
    organisationId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    total: number;
    succes: number;
    echec: number;
    ignore: number;
    parDeclencheur: Array<{
      declencheur: string;
      count: number;
      succes: number;
      echec: number;
    }>;
  }> {
    const queryBuilder = this.historiqueRepository
      .createQueryBuilder('historique')
      .leftJoin('historique.regle', 'regle')
      .where('historique.organisationId = :organisationId', { organisationId });

    if (dateFrom) {
      queryBuilder.andWhere('historique.dateExecution >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('historique.dateExecution <= :dateTo', { dateTo });
    }

    // Get totals by result
    const resultStats = await queryBuilder
      .clone()
      .select('historique.resultat', 'resultat')
      .addSelect('COUNT(*)', 'count')
      .groupBy('historique.resultat')
      .getRawMany();

    const stats = {
      total: 0,
      succes: 0,
      echec: 0,
      ignore: 0,
      parDeclencheur: [] as Array<{
        declencheur: string;
        count: number;
        succes: number;
        echec: number;
      }>,
    };

    for (const row of resultStats) {
      const count = parseInt(row.count, 10);
      stats.total += count;
      if (row.resultat === RelanceResultat.SUCCES) stats.succes = count;
      if (row.resultat === RelanceResultat.ECHEC) stats.echec = count;
      if (row.resultat === RelanceResultat.IGNORE) stats.ignore = count;
    }

    // Get stats by declencheur
    const declencheurStats = await queryBuilder
      .clone()
      .select('regle.declencheur', 'declencheur')
      .addSelect('historique.resultat', 'resultat')
      .addSelect('COUNT(*)', 'count')
      .groupBy('regle.declencheur')
      .addGroupBy('historique.resultat')
      .getRawMany();

    const declencheurMap = new Map<
      string,
      { count: number; succes: number; echec: number }
    >();

    for (const row of declencheurStats) {
      const declencheur = row.declencheur;
      if (!declencheurMap.has(declencheur)) {
        declencheurMap.set(declencheur, { count: 0, succes: 0, echec: 0 });
      }
      const entry = declencheurMap.get(declencheur)!;
      const count = parseInt(row.count, 10);
      entry.count += count;
      if (row.resultat === RelanceResultat.SUCCES) entry.succes += count;
      if (row.resultat === RelanceResultat.ECHEC) entry.echec += count;
    }

    stats.parDeclencheur = Array.from(declencheurMap.entries()).map(([declencheur, data]) => ({
      declencheur,
      ...data,
    }));

    return stats;
  }
}
