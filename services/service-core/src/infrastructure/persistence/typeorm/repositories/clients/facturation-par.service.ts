import { status } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FacturationParEntity } from '../../../../../domain/clients/entities';

@Injectable()
export class FacturationParService {
  constructor(
    @InjectRepository(FacturationParEntity)
    private readonly repository: Repository<FacturationParEntity>,
  ) {}

  async create(data: Partial<FacturationParEntity>): Promise<FacturationParEntity> {
    if (data.code) {
      const existing = await this.repository.findOne({ where: { code: data.code } });
      if (existing) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `FacturationPar with code ${data.code} already exists`,
        });
      }
    }
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<FacturationParEntity>): Promise<FacturationParEntity> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<FacturationParEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `FacturationPar ${id} not found` });
    }
    return entity;
  }

  async findByCode(code: string): Promise<FacturationParEntity> {
    const entity = await this.repository.findOne({ where: { code } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `FacturationPar with code ${code} not found` });
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    data: FacturationParEntity[];
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
