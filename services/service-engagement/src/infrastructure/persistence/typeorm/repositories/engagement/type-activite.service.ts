import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeActiviteEntity } from '../../../../../domain/engagement/entities';

@Injectable()
export class TypeActiviteService {
  constructor(
    @InjectRepository(TypeActiviteEntity)
    private readonly typeActiviteRepository: Repository<TypeActiviteEntity>,
  ) {}

  async create(data: Partial<TypeActiviteEntity>): Promise<any> {
    const typeActivite = this.typeActiviteRepository.create(data);
    const saved = await this.typeActiviteRepository.save(typeActivite);
    return this.toProto(saved);
  }

  async update(id: string, data: Partial<TypeActiviteEntity>): Promise<any> {
    const typeActivite = await this.findEntityById(id);
    Object.assign(typeActivite, data);
    const saved = await this.typeActiviteRepository.save(typeActivite);
    return this.toProto(saved);
  }

  async findById(id: string): Promise<any> {
    const typeActivite = await this.findEntityById(id);
    return this.toProto(typeActivite);
  }

  async findByCode(code: string): Promise<any> {
    const typeActivite = await this.typeActiviteRepository.findOne({ where: { code } });
    if (!typeActivite) {
      throw new NotFoundException(`TypeActivite avec code ${code} non trouvé`);
    }
    return this.toProto(typeActivite);
  }

  async findAll(pagination?: { page: number; limit: number }): Promise<any> {
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
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.typeActiviteRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private async findEntityById(id: string): Promise<TypeActiviteEntity> {
    const typeActivite = await this.typeActiviteRepository.findOne({ where: { id } });
    if (!typeActivite) {
      throw new NotFoundException(`TypeActivite ${id} non trouvé`);
    }
    return typeActivite;
  }

  private toProto(entity: TypeActiviteEntity): any {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description || '',
      created_at: entity.createdAt?.toISOString() || '',
      updated_at: entity.updatedAt?.toISOString() || '',
    };
  }
}
