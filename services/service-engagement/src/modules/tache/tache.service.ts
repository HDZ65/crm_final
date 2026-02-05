import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Tache, TacheStatut, TacheType, TachePriorite } from './entities/tache.entity';

@Injectable()
export class TacheService {
  constructor(
    @InjectRepository(Tache)
    private readonly tacheRepository: Repository<Tache>,
  ) {}

  async create(data: Partial<Tache>): Promise<Tache> {
    const tache = this.tacheRepository.create(data);
    return this.tacheRepository.save(tache);
  }

  async update(id: string, data: Partial<Tache>): Promise<Tache> {
    const tache = await this.findById(id);
    Object.assign(tache, data);
    return this.tacheRepository.save(tache);
  }

  async findById(id: string): Promise<Tache> {
    const tache = await this.tacheRepository.findOne({ where: { id } });
    if (!tache) {
      throw new NotFoundException(`Tache ${id} non trouvée`);
    }
    return tache;
  }

  async findAll(
    filters?: {
      organisationId?: string;
      statut?: TacheStatut;
      type?: TacheType;
      priorite?: TachePriorite;
      search?: string;
      enRetard?: boolean;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: Tache[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.tacheRepository.createQueryBuilder('tache');

    if (filters?.organisationId) {
      queryBuilder.andWhere('tache.organisationId = :organisationId', {
        organisationId: filters.organisationId,
      });
    }

    if (filters?.statut) {
      queryBuilder.andWhere('tache.statut = :statut', { statut: filters.statut });
    }

    if (filters?.type) {
      queryBuilder.andWhere('tache.type = :type', { type: filters.type });
    }

    if (filters?.priorite) {
      queryBuilder.andWhere('tache.priorite = :priorite', { priorite: filters.priorite });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(tache.titre ILIKE :search OR tache.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.enRetard) {
      queryBuilder.andWhere('tache.dateEcheance < :now', { now: new Date() });
      queryBuilder.andWhere('tache.statut NOT IN (:...excludedStatuts)', {
        excludedStatuts: [TacheStatut.TERMINEE, TacheStatut.ANNULEE],
      });
    }

    queryBuilder.orderBy('tache.dateEcheance', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByAssigne(
    assigneA: string,
    periode?: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: Tache[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.tacheRepository.createQueryBuilder('tache');
    queryBuilder.where('tache.assigneA = :assigneA', { assigneA });

    if (periode) {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (periode) {
        case 'aujourd_hui':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'semaine':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          break;
        case 'mois':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        default:
          startDate = new Date(0);
      }

      queryBuilder.andWhere('tache.dateEcheance BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    queryBuilder.orderBy('tache.dateEcheance', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByClient(
    clientId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: Tache[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.tacheRepository.findAndCount({
      where: { clientId },
      skip,
      take: limit,
      order: { dateEcheance: 'ASC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByContrat(
    contratId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: Tache[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.tacheRepository.findAndCount({
      where: { contratId },
      skip,
      take: limit,
      order: { dateEcheance: 'ASC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByFacture(
    factureId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: Tache[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.tacheRepository.findAndCount({
      where: { factureId },
      skip,
      take: limit,
      order: { dateEcheance: 'ASC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findEnRetard(
    organisationId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: Tache[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.tacheRepository.createQueryBuilder('tache');
    queryBuilder.where('tache.organisationId = :organisationId', { organisationId });
    queryBuilder.andWhere('tache.dateEcheance < :now', { now: new Date() });
    queryBuilder.andWhere('tache.statut NOT IN (:...excludedStatuts)', {
      excludedStatuts: [TacheStatut.TERMINEE, TacheStatut.ANNULEE],
    });
    queryBuilder.orderBy('tache.dateEcheance', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(organisationId: string): Promise<{
    aFaire: number;
    enCours: number;
    terminee: number;
    annulee: number;
    enRetard: number;
    total: number;
  }> {
    const queryBuilder = this.tacheRepository.createQueryBuilder('tache');
    queryBuilder.where('tache.organisationId = :organisationId', { organisationId });

    const [aFaire, enCours, terminee, annulee] = await Promise.all([
      queryBuilder.clone().andWhere('tache.statut = :statut', { statut: TacheStatut.A_FAIRE }).getCount(),
      queryBuilder.clone().andWhere('tache.statut = :statut', { statut: TacheStatut.EN_COURS }).getCount(),
      queryBuilder.clone().andWhere('tache.statut = :statut', { statut: TacheStatut.TERMINEE }).getCount(),
      queryBuilder.clone().andWhere('tache.statut = :statut', { statut: TacheStatut.ANNULEE }).getCount(),
    ]);

    const enRetard = await queryBuilder
      .clone()
      .andWhere('tache.dateEcheance < :now', { now: new Date() })
      .andWhere('tache.statut NOT IN (:...excludedStatuts)', {
        excludedStatuts: [TacheStatut.TERMINEE, TacheStatut.ANNULEE],
      })
      .getCount();

    return {
      aFaire,
      enCours,
      terminee,
      annulee,
      enRetard,
      total: aFaire + enCours + terminee + annulee,
    };
  }

  async getAlertes(organisationId: string): Promise<{
    enRetard: Tache[];
    echeanceDemain: Tache[];
  }> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const enRetard = await this.tacheRepository
      .createQueryBuilder('tache')
      .where('tache.organisationId = :organisationId', { organisationId })
      .andWhere('tache.dateEcheance < :now', { now })
      .andWhere('tache.statut NOT IN (:...excludedStatuts)', {
        excludedStatuts: [TacheStatut.TERMINEE, TacheStatut.ANNULEE],
      })
      .orderBy('tache.dateEcheance', 'ASC')
      .take(10)
      .getMany();

    const echeanceDemain = await this.tacheRepository
      .createQueryBuilder('tache')
      .where('tache.organisationId = :organisationId', { organisationId })
      .andWhere('tache.dateEcheance BETWEEN :tomorrow AND :tomorrowEnd', {
        tomorrow,
        tomorrowEnd,
      })
      .andWhere('tache.statut NOT IN (:...excludedStatuts)', {
        excludedStatuts: [TacheStatut.TERMINEE, TacheStatut.ANNULEE],
      })
      .orderBy('tache.dateEcheance', 'ASC')
      .take(10)
      .getMany();

    return { enRetard, echeanceDemain };
  }

  async marquerEnCours(id: string): Promise<Tache> {
    const tache = await this.findById(id);
    tache.statut = TacheStatut.EN_COURS;
    return this.tacheRepository.save(tache);
  }

  async marquerTerminee(id: string): Promise<Tache> {
    const tache = await this.findById(id);
    tache.statut = TacheStatut.TERMINEE;
    tache.dateCompletion = new Date();
    return this.tacheRepository.save(tache);
  }

  async marquerAnnulee(id: string): Promise<Tache> {
    const tache = await this.findById(id);
    tache.statut = TacheStatut.ANNULEE;
    return this.tacheRepository.save(tache);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.tacheRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
