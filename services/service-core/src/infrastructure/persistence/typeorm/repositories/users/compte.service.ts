import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CompteEntity } from '../../../../../domain/users/entities';

@Injectable()
export class CompteService {
  private readonly logger = new Logger(CompteService.name);

  constructor(
    @InjectRepository(CompteEntity)
    private readonly repository: Repository<CompteEntity>,
  ) {}

  async create(input: { nom: string; etat?: string; createdByUserId?: string }): Promise<CompteEntity> {
    const entity = this.repository.create({
      nom: input.nom,
      etat: input.etat || 'actif',
      createdByUserId: input.createdByUserId || null,
      dateCreation: new Date(),
    });
    return this.repository.save(entity);
  }

  async update(input: { id: string; nom?: string; etat?: string }): Promise<CompteEntity> {
    const entity = await this.findById(input.id);

    if (input.nom !== undefined) entity.nom = input.nom;
    if (input.etat !== undefined) entity.etat = input.etat;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<CompteEntity> {
    if (!id) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Compte id is required' });
    }
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Compte ${id} not found` });
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string; etat?: string },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    comptes: CompteEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const where: FindOptionsWhere<CompteEntity> = {};
    if (filters?.search) where.nom = Like(`%${filters.search}%`);
    if (filters?.etat) where.etat = filters.etat;

    const [comptes, total] = await this.repository.findAndCount({
      where,
      order: { nom: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { comptes, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
