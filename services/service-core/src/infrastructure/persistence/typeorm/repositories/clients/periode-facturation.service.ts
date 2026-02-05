import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PeriodeFacturationEntity } from '../../../../../domain/clients/entities';

@Injectable()
export class PeriodeFacturationService {
  private readonly logger = new Logger(PeriodeFacturationService.name);

  constructor(
    @InjectRepository(PeriodeFacturationEntity)
    private readonly repository: Repository<PeriodeFacturationEntity>,
  ) {}

  async create(data: Partial<PeriodeFacturationEntity>): Promise<PeriodeFacturationEntity> {
    if (data.code) {
      const existing = await this.repository.findOne({ where: { code: data.code } });
      if (existing) {
        throw new RpcException({ code: status.ALREADY_EXISTS, message: `PeriodeFacturation with code ${data.code} already exists` });
      }
    }
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<PeriodeFacturationEntity>): Promise<PeriodeFacturationEntity> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<PeriodeFacturationEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `PeriodeFacturation ${id} not found` });
    }
    return entity;
  }

  async findByCode(code: string): Promise<PeriodeFacturationEntity> {
    const entity = await this.repository.findOne({ where: { code } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `PeriodeFacturation with code ${code} not found` });
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    data: PeriodeFacturationEntity[];
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
