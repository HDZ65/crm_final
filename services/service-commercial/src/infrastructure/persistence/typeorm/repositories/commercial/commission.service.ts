import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CommissionEntity } from '../../../../../domain/commercial/entities/commission.entity';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(CommissionEntity)
    private readonly commissionRepository: Repository<CommissionEntity>,
  ) {}

  async create(data: Partial<CommissionEntity>): Promise<CommissionEntity> {
    if (data.reference) {
      const existing = await this.commissionRepository.findOne({
        where: { reference: data.reference },
      });
      if (existing) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Commission avec reference "${data.reference}" existe deja`,
        });
      }
    }
    const commission = this.commissionRepository.create(data);
    return this.commissionRepository.save(commission);
  }

  async update(id: string, data: Partial<CommissionEntity>): Promise<CommissionEntity> {
    const commission = await this.findById(id);
    Object.assign(commission, data);
    return this.commissionRepository.save(commission);
  }

  async findById(id: string): Promise<CommissionEntity> {
    const commission = await this.commissionRepository.findOne({ where: { id } });
    if (!commission) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Commission ${id} non trouvee`,
      });
    }
    return commission;
  }

  async findAll(
    filters?: {
      organisationId?: string;
      apporteurId?: string;
      contratId?: string;
      periode?: string;
      statutId?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: CommissionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.commissionRepository.createQueryBuilder('c');

    if (filters?.organisationId) {
      qb.andWhere('c.organisationId = :orgId', { orgId: filters.organisationId });
    }
    if (filters?.apporteurId) {
      qb.andWhere('c.apporteurId = :apporteurId', { apporteurId: filters.apporteurId });
    }
    if (filters?.contratId) {
      qb.andWhere('c.contratId = :contratId', { contratId: filters.contratId });
    }
    if (filters?.periode) {
      qb.andWhere('c.periode = :periode', { periode: filters.periode });
    }
    if (filters?.statutId) {
      qb.andWhere('c.statutId = :statutId', { statutId: filters.statutId });
    }

    qb.orderBy('c.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.commissionRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
