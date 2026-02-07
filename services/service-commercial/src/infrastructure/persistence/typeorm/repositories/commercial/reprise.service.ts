import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RepriseCommissionEntity, StatutReprise } from '../../../../../domain/commercial/entities/reprise-commission.entity';

@Injectable()
export class RepriseService {
  constructor(
    @InjectRepository(RepriseCommissionEntity)
    private readonly repriseRepository: Repository<RepriseCommissionEntity>,
  ) {}

  async create(data: Partial<RepriseCommissionEntity>): Promise<RepriseCommissionEntity> {
    const reprise = this.repriseRepository.create(data);
    return this.repriseRepository.save(reprise);
  }

  async update(id: string, data: Partial<RepriseCommissionEntity>): Promise<RepriseCommissionEntity> {
    const reprise = await this.findById(id);
    Object.assign(reprise, data);
    return this.repriseRepository.save(reprise);
  }

  async findById(id: string): Promise<RepriseCommissionEntity> {
    const reprise = await this.repriseRepository.findOne({ where: { id } });
    if (!reprise) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Reprise ${id} non trouvee`,
      });
    }
    return reprise;
  }

  async findAll(
    filters?: {
      organisationId?: string;
      apporteurId?: string;
      commissionId?: string;
      statutReprise?: string;
      periodeApplication?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: RepriseCommissionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.repriseRepository.createQueryBuilder('r');

    if (filters?.organisationId) {
      qb.andWhere('r.organisationId = :orgId', { orgId: filters.organisationId });
    }
    if (filters?.apporteurId) {
      qb.andWhere('r.apporteurId = :apporteurId', { apporteurId: filters.apporteurId });
    }
    if (filters?.commissionId) {
      qb.andWhere('r.commissionOriginaleId = :commissionId', { commissionId: filters.commissionId });
    }
    if (filters?.statutReprise) {
      qb.andWhere('r.statutReprise = :statut', { statut: filters.statutReprise });
    }
    if (filters?.periodeApplication) {
      qb.andWhere('r.periodeApplication = :periode', { periode: filters.periodeApplication });
    }

    qb.orderBy('r.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async apply(id: string): Promise<RepriseCommissionEntity> {
    const reprise = await this.findById(id);
    reprise.statutReprise = StatutReprise.APPLIQUEE;
    reprise.dateApplication = new Date();
    return this.repriseRepository.save(reprise);
  }

  async cancel(id: string): Promise<RepriseCommissionEntity> {
    const reprise = await this.findById(id);
    reprise.statutReprise = StatutReprise.ANNULEE;
    return this.repriseRepository.save(reprise);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repriseRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
