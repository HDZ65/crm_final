import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeriodeFacturation } from './entities/periode-facturation.entity';

@Injectable()
export class PeriodeFacturationService {
  constructor(
    @InjectRepository(PeriodeFacturation)
    private readonly repository: Repository<PeriodeFacturation>,
  ) {}

  async create(data: Partial<PeriodeFacturation>): Promise<PeriodeFacturation> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<PeriodeFacturation>): Promise<PeriodeFacturation> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<PeriodeFacturation> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`PeriodeFacturation ${id} non trouvée`);
    }
    return entity;
  }

  async findByCode(code: string): Promise<PeriodeFacturation> {
    const entity = await this.repository.findOne({ where: { code } });
    if (!entity) {
      throw new NotFoundException(`PeriodeFacturation avec code ${code} non trouvée`);
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: PeriodeFacturation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('p');

    if (filters?.search) {
      queryBuilder.andWhere('(p.code ILIKE :search OR p.nom ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    queryBuilder.orderBy('p.nom', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
