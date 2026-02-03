import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { TransporteurCompteEntity } from './entities/transporteur-compte.entity';

@Injectable()
export class TransporteurCompteService {
  private readonly logger = new Logger(TransporteurCompteService.name);

  constructor(
    @InjectRepository(TransporteurCompteEntity)
    private readonly repository: Repository<TransporteurCompteEntity>,
  ) {}

  async create(data: Partial<TransporteurCompteEntity>): Promise<TransporteurCompteEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<TransporteurCompteEntity>): Promise<TransporteurCompteEntity> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<TransporteurCompteEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `TransporteurCompte ${id} not found` });
    }
    return entity;
  }

  async findByOrganisation(
    organisationId: string,
    actif?: boolean,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    data: TransporteurCompteEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('t');
    queryBuilder.where('t.organisationId = :organisationId', { organisationId });

    if (actif !== undefined) {
      queryBuilder.andWhere('t.actif = :actif', { actif });
    }

    queryBuilder.orderBy('t.type', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAll(
    filters?: { type?: string; actif?: boolean },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    data: TransporteurCompteEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('t');

    if (filters?.type) {
      queryBuilder.andWhere('t.type = :type', { type: filters.type });
    }

    if (filters?.actif !== undefined) {
      queryBuilder.andWhere('t.actif = :actif', { actif: filters.actif });
    }

    queryBuilder.orderBy('t.type', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async activer(id: string): Promise<TransporteurCompteEntity> {
    const entity = await this.findById(id);
    entity.actif = true;
    return this.repository.save(entity);
  }

  async desactiver(id: string): Promise<TransporteurCompteEntity> {
    const entity = await this.findById(id);
    entity.actif = false;
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
