import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportNegatifEntity } from '../../../../../domain/commercial/entities/report-negatif.entity';

@Injectable()
export class ReportNegatifService {
  constructor(
    @InjectRepository(ReportNegatifEntity)
    private readonly reportRepository: Repository<ReportNegatifEntity>,
  ) {}

  async findAll(
    filters?: {
      organisationId?: string;
      apporteurId?: string;
      statutReport?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: ReportNegatifEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.reportRepository.createQueryBuilder('r');

    if (filters?.organisationId) {
      qb.andWhere('r.organisationId = :orgId', { orgId: filters.organisationId });
    }
    if (filters?.apporteurId) {
      qb.andWhere('r.apporteurId = :apporteurId', { apporteurId: filters.apporteurId });
    }
    if (filters?.statutReport) {
      qb.andWhere('r.statutReport = :statut', { statut: filters.statutReport });
    }

    qb.orderBy('r.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
