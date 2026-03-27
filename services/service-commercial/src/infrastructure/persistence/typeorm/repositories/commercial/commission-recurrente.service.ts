import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionRecurrenteEntity } from '../../../../../domain/commercial/entities/commission-recurrente.entity';

@Injectable()
export class CommissionRecurrenteService {
  constructor(
    @InjectRepository(CommissionRecurrenteEntity)
    private readonly recurrenteRepository: Repository<CommissionRecurrenteEntity>,
  ) {}

  async findAll(
    filters?: {
      organisationId?: string;
      apporteurId?: string;
      contratId?: string;
      periode?: string;
      statutRecurrence?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: CommissionRecurrenteEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.recurrenteRepository.createQueryBuilder('r');

    if (filters?.organisationId) {
      qb.andWhere('r.organisationId = :orgId', { orgId: filters.organisationId });
    }
    if (filters?.apporteurId) {
      qb.andWhere('r.apporteurId = :apporteurId', { apporteurId: filters.apporteurId });
    }
    if (filters?.contratId) {
      qb.andWhere('r.contratId = :contratId', { contratId: filters.contratId });
    }
    if (filters?.periode) {
      qb.andWhere('r.periode = :periode', { periode: filters.periode });
    }
    if (filters?.statutRecurrence) {
      qb.andWhere('r.statutRecurrence = :statut', { statut: filters.statutRecurrence });
    }

    qb.orderBy('r.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByContrat(
    contratId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: CommissionRecurrenteEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.recurrenteRepository.findAndCount({
      where: { contratId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
