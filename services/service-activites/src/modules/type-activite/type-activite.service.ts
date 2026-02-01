import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeActivite } from './entities/type-activite.entity';
import type {
  TypeActivite as TypeActiviteProto,
  ListTypeActiviteResponse,
} from '@crm/proto/activites';

@Injectable()
export class TypeActiviteService {
  constructor(
    @InjectRepository(TypeActivite)
    private readonly typeActiviteRepository: Repository<TypeActivite>,
  ) {}

  async create(data: Partial<TypeActivite>): Promise<TypeActiviteProto> {
    const typeActivite = this.typeActiviteRepository.create(data);
    const saved = await this.typeActiviteRepository.save(typeActivite);
    return this.toProto(saved);
  }

  async update(id: string, data: Partial<TypeActivite>): Promise<TypeActiviteProto> {
    const typeActivite = await this.findEntityById(id);
    Object.assign(typeActivite, data);
    const saved = await this.typeActiviteRepository.save(typeActivite);
    return this.toProto(saved);
  }

  async findById(id: string): Promise<TypeActiviteProto> {
    const typeActivite = await this.findEntityById(id);
    return this.toProto(typeActivite);
  }

  async findByCode(code: string): Promise<TypeActiviteProto> {
    const typeActivite = await this.typeActiviteRepository.findOne({ where: { code } });
    if (!typeActivite) {
      throw new NotFoundException(`TypeActivite avec code ${code} non trouvé`);
    }
    return this.toProto(typeActivite);
  }

  async findAll(pagination?: { page: number; limit: number }): Promise<ListTypeActiviteResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.typeActiviteRepository.findAndCount({
      skip,
      take: limit,
      order: { nom: 'ASC' },
    });

    return {
      types: data.map((t) => this.toProto(t)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.typeActiviteRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private async findEntityById(id: string): Promise<TypeActivite> {
    const typeActivite = await this.typeActiviteRepository.findOne({ where: { id } });
    if (!typeActivite) {
      throw new NotFoundException(`TypeActivite ${id} non trouvé`);
    }
    return typeActivite;
  }

  private toProto(entity: TypeActivite): TypeActiviteProto {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description || '',
      createdAt: entity.createdAt?.toISOString() || '',
      updatedAt: entity.updatedAt?.toISOString() || '',
    };
  }
}
