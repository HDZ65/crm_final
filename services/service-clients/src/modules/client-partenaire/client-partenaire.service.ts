import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ClientPartenaireEntity } from './entities/client-partenaire.entity';

@Injectable()
export class ClientPartenaireService {
  private readonly logger = new Logger(ClientPartenaireService.name);

  constructor(
    @InjectRepository(ClientPartenaireEntity)
    private readonly repository: Repository<ClientPartenaireEntity>,
  ) {}

  async create(input: {
    clientBaseId: string;
    partenaireId: string;
    rolePartenaireId: string;
    validFrom: string;
    validTo?: string;
  }): Promise<ClientPartenaireEntity> {
    const entity = this.repository.create({
      clientBaseId: input.clientBaseId,
      partenaireId: input.partenaireId,
      rolePartenaireId: input.rolePartenaireId,
      validFrom: input.validFrom,
      validTo: input.validTo || null,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    partenaireId?: string;
    rolePartenaireId?: string;
    validFrom?: string;
    validTo?: string;
  }): Promise<ClientPartenaireEntity> {
    const entity = await this.findById(input.id);

    if (input.partenaireId !== undefined) entity.partenaireId = input.partenaireId;
    if (input.rolePartenaireId !== undefined) entity.rolePartenaireId = input.rolePartenaireId;
    if (input.validFrom !== undefined) entity.validFrom = input.validFrom;
    if (input.validTo !== undefined) entity.validTo = input.validTo || null;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<ClientPartenaireEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Client partenaire ${id} not found` });
    }
    return entity;
  }

  async findAll(
    filters?: { clientBaseId?: string; partenaireId?: string },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    clients: ClientPartenaireEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const where: any = {};
    if (filters?.clientBaseId) where.clientBaseId = filters.clientBaseId;
    if (filters?.partenaireId) where.partenaireId = filters.partenaireId;

    const [clients, total] = await this.repository.findAndCount({
      where,
      order: { validFrom: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { clients, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
