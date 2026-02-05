import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { EmissionFactureEntity } from '../../../../../domain/clients/entities';

@Injectable()
export class EmissionFactureService {
  private readonly logger = new Logger(EmissionFactureService.name);

  constructor(
    @InjectRepository(EmissionFactureEntity)
    private readonly repository: Repository<EmissionFactureEntity>,
  ) {}

  async create(data: Partial<EmissionFactureEntity>): Promise<EmissionFactureEntity> {
    if (data.code) {
      const existing = await this.repository.findOne({ where: { code: data.code } });
      if (existing) {
        throw new RpcException({ code: status.ALREADY_EXISTS, message: `EmissionFacture with code ${data.code} already exists` });
      }
    }
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<EmissionFactureEntity>): Promise<EmissionFactureEntity> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<EmissionFactureEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `EmissionFacture ${id} not found` });
    }
    return entity;
  }

  async findByCode(code: string): Promise<EmissionFactureEntity> {
    const entity = await this.repository.findOne({ where: { code } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `EmissionFacture with code ${code} not found` });
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    data: EmissionFactureEntity[];
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
