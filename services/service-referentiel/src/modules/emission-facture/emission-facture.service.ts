import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmissionFacture } from './entities/emission-facture.entity';

@Injectable()
export class EmissionFactureService {
  constructor(
    @InjectRepository(EmissionFacture)
    private readonly repository: Repository<EmissionFacture>,
  ) {}

  async create(data: Partial<EmissionFacture>): Promise<EmissionFacture> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<EmissionFacture>): Promise<EmissionFacture> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<EmissionFacture> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`EmissionFacture ${id} non trouvée`);
    }
    return entity;
  }

  async findByCode(code: string): Promise<EmissionFacture> {
    const entity = await this.repository.findOne({ where: { code } });
    if (!entity) {
      throw new NotFoundException(`EmissionFacture avec code ${code} non trouvée`);
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: EmissionFacture[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('e');

    if (filters?.search) {
      queryBuilder.andWhere('(e.code ILIKE :search OR e.nom ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    queryBuilder.orderBy('e.nom', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
