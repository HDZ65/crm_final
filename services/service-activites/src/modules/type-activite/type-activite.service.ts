import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeActivite } from './entities/type-activite.entity';

@Injectable()
export class TypeActiviteService {
  constructor(
    @InjectRepository(TypeActivite)
    private readonly typeActiviteRepository: Repository<TypeActivite>,
  ) {}

  async create(data: Partial<TypeActivite>): Promise<TypeActivite> {
    const typeActivite = this.typeActiviteRepository.create(data);
    return this.typeActiviteRepository.save(typeActivite);
  }

  async update(id: string, data: Partial<TypeActivite>): Promise<TypeActivite> {
    const typeActivite = await this.findById(id);
    Object.assign(typeActivite, data);
    return this.typeActiviteRepository.save(typeActivite);
  }

  async findById(id: string): Promise<TypeActivite> {
    const typeActivite = await this.typeActiviteRepository.findOne({ where: { id } });
    if (!typeActivite) {
      throw new NotFoundException(`TypeActivite ${id} non trouvé`);
    }
    return typeActivite;
  }

  async findByCode(code: string): Promise<TypeActivite> {
    const typeActivite = await this.typeActiviteRepository.findOne({ where: { code } });
    if (!typeActivite) {
      throw new NotFoundException(`TypeActivite avec code ${code} non trouvé`);
    }
    return typeActivite;
  }

  async findAll(pagination?: { page: number; limit: number }): Promise<{
    data: TypeActivite[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.typeActiviteRepository.findAndCount({
      skip,
      take: limit,
      order: { nom: 'ASC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.typeActiviteRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
