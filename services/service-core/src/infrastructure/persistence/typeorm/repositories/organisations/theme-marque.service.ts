import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ThemeMarqueEntity } from '../../../../../domain/organisations/entities';

@Injectable()
export class ThemeMarqueService {
  private readonly logger = new Logger(ThemeMarqueService.name);

  constructor(
    @InjectRepository(ThemeMarqueEntity)
    private readonly repository: Repository<ThemeMarqueEntity>,
  ) {}

  async create(input: {
    logoUrl: string;
    couleurPrimaire: string;
    couleurSecondaire: string;
    faviconUrl: string;
  }): Promise<ThemeMarqueEntity> {
    const entity = this.repository.create({
      logoUrl: input.logoUrl,
      couleurPrimaire: input.couleurPrimaire,
      couleurSecondaire: input.couleurSecondaire,
      faviconUrl: input.faviconUrl,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    logoUrl?: string;
    couleurPrimaire?: string;
    couleurSecondaire?: string;
    faviconUrl?: string;
  }): Promise<ThemeMarqueEntity> {
    const entity = await this.findById(input.id);

    if (input.logoUrl !== undefined) entity.logoUrl = input.logoUrl;
    if (input.couleurPrimaire !== undefined) entity.couleurPrimaire = input.couleurPrimaire;
    if (input.couleurSecondaire !== undefined) entity.couleurSecondaire = input.couleurSecondaire;
    if (input.faviconUrl !== undefined) entity.faviconUrl = input.faviconUrl;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<ThemeMarqueEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `ThemeMarque ${id} not found` });
    }
    return entity;
  }

  async findAll(pagination?: { page?: number; limit?: number }): Promise<{
    themes: ThemeMarqueEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [themes, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { themes, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
