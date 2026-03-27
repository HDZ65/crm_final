import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { BordereauCommissionEntity, StatutBordereau } from '../../../../../domain/commercial/entities/bordereau-commission.entity';

@Injectable()
export class BordereauService {
  constructor(
    @InjectRepository(BordereauCommissionEntity)
    private readonly bordereauRepository: Repository<BordereauCommissionEntity>,
  ) {}

  async create(data: Partial<BordereauCommissionEntity>): Promise<BordereauCommissionEntity> {
    if (data.reference) {
      const existing = await this.bordereauRepository.findOne({
        where: { reference: data.reference },
      });
      if (existing) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Bordereau avec reference "${data.reference}" existe deja`,
        });
      }
    }
    const bordereau = this.bordereauRepository.create(data);
    return this.bordereauRepository.save(bordereau);
  }

  async update(id: string, data: Partial<BordereauCommissionEntity>): Promise<BordereauCommissionEntity> {
    const bordereau = await this.findById(id);
    Object.assign(bordereau, data);
    return this.bordereauRepository.save(bordereau);
  }

  async findById(id: string): Promise<BordereauCommissionEntity> {
    const bordereau = await this.bordereauRepository.findOne({
      where: { id },
      relations: ['lignes'],
    });
    if (!bordereau) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Bordereau ${id} non trouve`,
      });
    }
    return bordereau;
  }

  async findByApporteurPeriode(
    organisationId: string,
    apporteurId: string,
    periode: string,
  ): Promise<BordereauCommissionEntity> {
    const bordereau = await this.bordereauRepository.findOne({
      where: { organisationId, apporteurId, periode },
      relations: ['lignes'],
    });
    if (!bordereau) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Bordereau pour apporteur ${apporteurId} periode ${periode} non trouve`,
      });
    }
    return bordereau;
  }

  async findAll(
    filters?: {
      organisationId?: string;
      apporteurId?: string;
      periode?: string;
      statutBordereau?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: BordereauCommissionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.bordereauRepository.createQueryBuilder('b');

    if (filters?.organisationId) {
      qb.andWhere('b.organisationId = :orgId', { orgId: filters.organisationId });
    }
    if (filters?.apporteurId) {
      qb.andWhere('b.apporteurId = :apporteurId', { apporteurId: filters.apporteurId });
    }
    if (filters?.periode) {
      qb.andWhere('b.periode = :periode', { periode: filters.periode });
    }
    if (filters?.statutBordereau) {
      qb.andWhere('b.statutBordereau = :statut', { statut: filters.statutBordereau });
    }

    qb.orderBy('b.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async validate(id: string, validateurId: string): Promise<BordereauCommissionEntity> {
    const bordereau = await this.findById(id);
    bordereau.statutBordereau = StatutBordereau.VALIDE;
    bordereau.validateurId = validateurId;
    bordereau.dateValidation = new Date();
    return this.bordereauRepository.save(bordereau);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.bordereauRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
