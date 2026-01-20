import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SocieteEntity } from './entities/societe.entity';

@Injectable()
export class SocieteService {
  private readonly logger = new Logger(SocieteService.name);

  constructor(
    @InjectRepository(SocieteEntity)
    private readonly repository: Repository<SocieteEntity>,
  ) {}

  async create(input: {
    organisationId: string;
    raisonSociale: string;
    siren: string;
    numeroTVA: string;
  }): Promise<SocieteEntity> {
    const entity = this.repository.create({
      organisationId: input.organisationId,
      raisonSociale: input.raisonSociale,
      siren: input.siren,
      numeroTVA: input.numeroTVA,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    raisonSociale?: string;
    siren?: string;
    numeroTVA?: string;
  }): Promise<SocieteEntity> {
    const entity = await this.findById(input.id);

    if (input.raisonSociale !== undefined) entity.raisonSociale = input.raisonSociale;
    if (input.siren !== undefined) entity.siren = input.siren;
    if (input.numeroTVA !== undefined) entity.numeroTVA = input.numeroTVA;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<SocieteEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Societe ${id} not found` });
    }
    return entity;
  }

  async findByOrganisation(
    organisationId: string,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    societes: SocieteEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [societes, total] = await this.repository.findAndCount({
      where: { organisationId },
      order: { raisonSociale: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { societes, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findAll(
    filters?: { search?: string },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    societes: SocieteEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const queryBuilder = this.repository.createQueryBuilder('s');

    if (filters?.search) {
      queryBuilder.where('(s.raison_sociale ILIKE :search OR s.siren ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [societes, total] = await queryBuilder
      .orderBy('s.raison_sociale', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { societes, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
