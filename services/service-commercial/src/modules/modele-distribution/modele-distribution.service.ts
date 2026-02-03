import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModeleDistribution } from './entities/modele-distribution.entity';

@Injectable()
export class ModeleDistributionService {
  constructor(
    @InjectRepository(ModeleDistribution)
    private readonly modeleRepository: Repository<ModeleDistribution>,
  ) {}

  async create(data: Partial<ModeleDistribution>): Promise<ModeleDistribution> {
    const modele = this.modeleRepository.create(data);
    return this.modeleRepository.save(modele);
  }

  async update(id: string, data: Partial<ModeleDistribution>): Promise<ModeleDistribution> {
    const modele = await this.findById(id);
    Object.assign(modele, data);
    return this.modeleRepository.save(modele);
  }

  async findById(id: string): Promise<ModeleDistribution> {
    const modele = await this.modeleRepository.findOne({ where: { id } });
    if (!modele) {
      throw new NotFoundException(`ModeleDistribution ${id} non trouvé`);
    }
    return modele;
  }

  async findByCode(code: string): Promise<ModeleDistribution> {
    const modele = await this.modeleRepository.findOne({ where: { code } });
    if (!modele) {
      throw new NotFoundException(`ModeleDistribution avec code ${code} non trouvé`);
    }
    return modele;
  }

  async findAll(
    filters?: { search?: string },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: ModeleDistribution[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.modeleRepository.createQueryBuilder('modele');

    if (filters?.search) {
      queryBuilder.andWhere(
        '(modele.code ILIKE :search OR modele.nom ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder.orderBy('modele.nom', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.modeleRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
