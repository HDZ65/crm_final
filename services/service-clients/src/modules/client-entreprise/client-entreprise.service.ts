import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ClientEntrepriseEntity } from './entities/client-entreprise.entity';

@Injectable()
export class ClientEntrepriseService {
  private readonly logger = new Logger(ClientEntrepriseService.name);

  constructor(
    @InjectRepository(ClientEntrepriseEntity)
    private readonly repository: Repository<ClientEntrepriseEntity>,
  ) {}

  async create(input: {
    raisonSociale: string;
    numeroTva: string;
    siren: string;
  }): Promise<ClientEntrepriseEntity> {
    // Check for duplicate SIREN
    const existing = await this.repository.findOne({ where: { siren: input.siren } });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Enterprise with SIREN ${input.siren} already exists`,
      });
    }

    const entity = this.repository.create({
      raisonSociale: input.raisonSociale,
      numeroTva: input.numeroTva,
      siren: input.siren,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    raisonSociale?: string;
    numeroTva?: string;
    siren?: string;
  }): Promise<ClientEntrepriseEntity> {
    const entity = await this.findById(input.id);

    if (input.raisonSociale !== undefined) entity.raisonSociale = input.raisonSociale;
    if (input.numeroTva !== undefined) entity.numeroTva = input.numeroTva;
    if (input.siren !== undefined) entity.siren = input.siren;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<ClientEntrepriseEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Client entreprise ${id} not found` });
    }
    return entity;
  }

  async findAll(pagination?: { page?: number; limit?: number }): Promise<{
    clients: ClientEntrepriseEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const [clients, total] = await this.repository.findAndCount({
      order: { raisonSociale: 'ASC' },
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
