import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConditionPaiement } from './entities/condition-paiement.entity';

@Injectable()
export class ConditionPaiementService {
  constructor(
    @InjectRepository(ConditionPaiement)
    private readonly repository: Repository<ConditionPaiement>,
  ) {}

  async create(data: Partial<ConditionPaiement>): Promise<ConditionPaiement> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<ConditionPaiement>): Promise<ConditionPaiement> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<ConditionPaiement> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`ConditionPaiement ${id} non trouvée`);
    }
    return entity;
  }

  async findByCode(code: string): Promise<ConditionPaiement> {
    const entity = await this.repository.findOne({ where: { code } });
    if (!entity) {
      throw new NotFoundException(`ConditionPaiement avec code ${code} non trouvée`);
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: ConditionPaiement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('c');

    if (filters?.search) {
      queryBuilder.andWhere('(c.code ILIKE :search OR c.nom ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    queryBuilder.orderBy('c.delaiJours', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
