import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionEntity } from './entities/commission.entity';

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    @InjectRepository(CommissionEntity)
    private readonly commissionRepository: Repository<CommissionEntity>,
  ) {}

  async create(data: Partial<CommissionEntity>): Promise<CommissionEntity> {
    const commission = this.commissionRepository.create(data);
    const saved = await this.commissionRepository.save(commission);
    this.logger.log(`Created commission ${saved.id}`);
    return saved;
  }

  async findById(id: string): Promise<CommissionEntity> {
    const commission = await this.commissionRepository.findOne({
      where: { id },
      relations: ['statut'],
    });
    if (!commission) {
      throw new NotFoundException(`Commission ${id} not found`);
    }
    return commission;
  }

  async findByOrganisation(
    organisationId: string,
    options?: {
      apporteurId?: string;
      periode?: string;
      statutId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ commissions: CommissionEntity[]; total: number }> {
    const qb = this.commissionRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.statut', 'statut')
      .where('c.organisation_id = :organisationId', { organisationId });

    if (options?.apporteurId) {
      qb.andWhere('c.apporteur_id = :apporteurId', { apporteurId: options.apporteurId });
    }
    if (options?.periode) {
      qb.andWhere('c.periode = :periode', { periode: options.periode });
    }
    if (options?.statutId) {
      qb.andWhere('c.statut_id = :statutId', { statutId: options.statutId });
    }

    qb.orderBy('c.created_at', 'DESC');

    const total = await qb.getCount();

    if (options?.limit) qb.take(options.limit);
    if (options?.offset) qb.skip(options.offset);

    const commissions = await qb.getMany();
    return { commissions, total };
  }

  async findByApporteur(
    organisationId: string,
    apporteurId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ commissions: CommissionEntity[]; total: number }> {
    return this.findByOrganisation(organisationId, { apporteurId, limit, offset });
  }

  async findByPeriode(
    organisationId: string,
    periode: string,
    limit?: number,
    offset?: number,
  ): Promise<{ commissions: CommissionEntity[]; total: number }> {
    return this.findByOrganisation(organisationId, { periode, limit, offset });
  }

  async update(id: string, data: Partial<CommissionEntity>): Promise<CommissionEntity> {
    const commission = await this.findById(id);
    Object.assign(commission, data);
    return this.commissionRepository.save(commission);
  }

  async delete(id: string): Promise<void> {
    const commission = await this.findById(id);
    await this.commissionRepository.remove(commission);
    this.logger.log(`Deleted commission ${id}`);
  }
}
