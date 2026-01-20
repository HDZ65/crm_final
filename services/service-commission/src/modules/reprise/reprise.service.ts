import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepriseCommissionEntity, StatutReprise } from './entities/reprise-commission.entity';

@Injectable()
export class RepriseService {
  private readonly logger = new Logger(RepriseService.name);

  constructor(
    @InjectRepository(RepriseCommissionEntity)
    private readonly repriseRepository: Repository<RepriseCommissionEntity>,
  ) {}

  async create(data: Partial<RepriseCommissionEntity>): Promise<RepriseCommissionEntity> {
    const reprise = this.repriseRepository.create({
      ...data,
      statutReprise: StatutReprise.EN_ATTENTE,
    });
    const saved = await this.repriseRepository.save(reprise);
    this.logger.log(`Created reprise ${saved.id}`);
    return saved;
  }

  async findById(id: string): Promise<RepriseCommissionEntity> {
    const reprise = await this.repriseRepository.findOne({ where: { id } });
    if (!reprise) {
      throw new NotFoundException(`Reprise ${id} not found`);
    }
    return reprise;
  }

  async findByOrganisation(
    organisationId: string,
    options?: {
      apporteurId?: string;
      statut?: StatutReprise;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ reprises: RepriseCommissionEntity[]; total: number }> {
    const qb = this.repriseRepository
      .createQueryBuilder('r')
      .where('r.organisation_id = :organisationId', { organisationId });

    if (options?.apporteurId) {
      qb.andWhere('r.apporteur_id = :apporteurId', { apporteurId: options.apporteurId });
    }
    if (options?.statut) {
      qb.andWhere('r.statut_reprise = :statut', { statut: options.statut });
    }

    qb.orderBy('r.created_at', 'DESC');

    const total = await qb.getCount();

    if (options?.limit) qb.take(options.limit);
    if (options?.offset) qb.skip(options.offset);

    const reprises = await qb.getMany();
    return { reprises, total };
  }

  async findByCommission(commissionId: string): Promise<{ reprises: RepriseCommissionEntity[]; total: number }> {
    const [reprises, total] = await this.repriseRepository.findAndCount({
      where: { commissionOriginaleId: commissionId },
      order: { createdAt: 'DESC' },
    });
    return { reprises, total };
  }

  async findPending(organisationId: string, apporteurId: string, periode: string): Promise<RepriseCommissionEntity[]> {
    return this.repriseRepository.find({
      where: {
        organisationId,
        apporteurId,
        periodeApplication: periode,
        statutReprise: StatutReprise.EN_ATTENTE,
      },
    });
  }

  async apply(id: string, bordereauId: string): Promise<RepriseCommissionEntity> {
    const reprise = await this.findById(id);
    reprise.statutReprise = StatutReprise.APPLIQUEE;
    reprise.bordereauId = bordereauId;
    reprise.dateApplication = new Date();
    return this.repriseRepository.save(reprise);
  }

  async cancel(id: string): Promise<RepriseCommissionEntity> {
    const reprise = await this.findById(id);
    reprise.statutReprise = StatutReprise.ANNULEE;
    return this.repriseRepository.save(reprise);
  }

  async delete(id: string): Promise<void> {
    const reprise = await this.findById(id);
    await this.repriseRepository.remove(reprise);
    this.logger.log(`Deleted reprise ${id}`);
  }
}
