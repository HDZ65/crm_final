import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatutClient } from './entities/statut-client.entity';

@Injectable()
export class StatutClientService {
  constructor(
    @InjectRepository(StatutClient)
    private readonly repository: Repository<StatutClient>,
  ) {}

  async create(data: Partial<StatutClient>): Promise<StatutClient> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<StatutClient>): Promise<StatutClient> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<StatutClient> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`StatutClient ${id} non trouvé`);
    }
    return entity;
  }

  async findByCode(code: string): Promise<StatutClient> {
    const entity = await this.repository.findOne({ where: { code } });
    if (!entity) {
      throw new NotFoundException(`StatutClient avec code ${code} non trouvé`);
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: StatutClient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('s');

    if (filters?.search) {
      queryBuilder.andWhere('(s.code ILIKE :search OR s.nom ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    queryBuilder.orderBy('s.ordreAffichage', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
