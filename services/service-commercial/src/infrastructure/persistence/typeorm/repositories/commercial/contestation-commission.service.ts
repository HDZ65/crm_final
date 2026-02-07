import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ContestationCommissionEntity } from '../../../../../domain/commercial/entities/contestation-commission.entity';

@Injectable()
export class ContestationCommissionService {
  constructor(
    @InjectRepository(ContestationCommissionEntity)
    private readonly contestationRepository: Repository<ContestationCommissionEntity>,
  ) {}

  async create(data: Partial<ContestationCommissionEntity>): Promise<ContestationCommissionEntity> {
    const contestation = this.contestationRepository.create(data);
    return this.contestationRepository.save(contestation);
  }

  async update(id: string, data: Partial<ContestationCommissionEntity>): Promise<ContestationCommissionEntity> {
    const contestation = await this.findById(id);
    Object.assign(contestation, data);
    return this.contestationRepository.save(contestation);
  }

  async findById(id: string): Promise<ContestationCommissionEntity> {
    const contestation = await this.contestationRepository.findOne({ where: { id } });
    if (!contestation) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Contestation ${id} non trouvee`,
      });
    }
    return contestation;
  }

  async findAll(
    filters?: {
      organisationId?: string;
      commissionId?: string;
      bordereauId?: string;
      apporteurId?: string;
      statut?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: ContestationCommissionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.contestationRepository.createQueryBuilder('c');

    if (filters?.organisationId) {
      qb.andWhere('c.organisationId = :organisationId', { organisationId: filters.organisationId });
    }
    if (filters?.commissionId) {
      qb.andWhere('c.commissionId = :commissionId', { commissionId: filters.commissionId });
    }
    if (filters?.bordereauId) {
      qb.andWhere('c.bordereauId = :bordereauId', { bordereauId: filters.bordereauId });
    }
    if (filters?.apporteurId) {
      qb.andWhere('c.apporteurId = :apporteurId', { apporteurId: filters.apporteurId });
    }
    if (filters?.statut) {
      qb.andWhere('c.statut = :statut', { statut: filters.statut });
    }

    qb.orderBy('c.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
