import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { StatutContratEntity } from './entities/statut-contrat.entity';

@Injectable()
export class StatutContratService {
  private readonly logger = new Logger(StatutContratService.name);

  constructor(
    @InjectRepository(StatutContratEntity)
    private readonly repository: Repository<StatutContratEntity>,
  ) {}

  async create(input: {
    code: string;
    nom: string;
    description?: string;
    ordreAffichage?: number;
  }): Promise<StatutContratEntity> {
    const existing = await this.repository.findOne({ where: { code: input.code } });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Statut contrat with code ${input.code} already exists`,
      });
    }

    const entity = this.repository.create({
      code: input.code,
      nom: input.nom,
      description: input.description || null,
      ordreAffichage: input.ordreAffichage ?? 0,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    code?: string;
    nom?: string;
    description?: string;
    ordreAffichage?: number;
  }): Promise<StatutContratEntity> {
    const entity = await this.findById(input.id);

    if (input.code !== undefined) entity.code = input.code;
    if (input.nom !== undefined) entity.nom = input.nom;
    if (input.description !== undefined) entity.description = input.description || null;
    if (input.ordreAffichage !== undefined) entity.ordreAffichage = input.ordreAffichage;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<StatutContratEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Statut contrat ${id} not found` });
    }
    return entity;
  }

  async findByCode(code: string): Promise<StatutContratEntity> {
    const entity = await this.repository.findOne({ where: { code } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Statut contrat with code ${code} not found` });
    }
    return entity;
  }

  async findAll(pagination?: { page?: number; limit?: number }): Promise<{
    statuts: StatutContratEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [statuts, total] = await this.repository.findAndCount({
      order: { ordreAffichage: 'ASC', nom: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { statuts, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
