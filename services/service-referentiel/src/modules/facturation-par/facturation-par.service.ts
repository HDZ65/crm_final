import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FacturationPar } from './entities/facturation-par.entity';

@Injectable()
export class FacturationParService {
  constructor(
    @InjectRepository(FacturationPar)
    private readonly repository: Repository<FacturationPar>,
  ) {}

  async create(data: Partial<FacturationPar>): Promise<FacturationPar> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<FacturationPar>): Promise<FacturationPar> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<FacturationPar> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`FacturationPar ${id} non trouvée`);
    }
    return entity;
  }

  async findByCode(code: string): Promise<FacturationPar> {
    const entity = await this.repository.findOne({ where: { code } });
    if (!entity) {
      throw new NotFoundException(`FacturationPar avec code ${code} non trouvée`);
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: FacturationPar[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('f');

    if (filters?.search) {
      queryBuilder.andWhere('(f.code ILIKE :search OR f.nom ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    queryBuilder.orderBy('f.nom', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
