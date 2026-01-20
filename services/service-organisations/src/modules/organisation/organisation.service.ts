import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { OrganisationEntity } from './entities/organisation.entity';

@Injectable()
export class OrganisationService {
  private readonly logger = new Logger(OrganisationService.name);

  constructor(
    @InjectRepository(OrganisationEntity)
    private readonly repository: Repository<OrganisationEntity>,
  ) {}

  async create(input: {
    nom: string;
    description?: string;
    siret?: string;
    adresse?: string;
    telephone?: string;
    email?: string;
    actif?: boolean;
  }): Promise<OrganisationEntity> {
    const entity = this.repository.create({
      nom: input.nom,
      description: input.description || null,
      siret: input.siret || null,
      adresse: input.adresse || null,
      telephone: input.telephone || null,
      email: input.email || null,
      actif: input.actif ?? true,
      etat: 'actif',
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    nom?: string;
    description?: string;
    siret?: string;
    adresse?: string;
    telephone?: string;
    email?: string;
    actif?: boolean;
    etat?: string;
  }): Promise<OrganisationEntity> {
    const entity = await this.findById(input.id);

    if (input.nom !== undefined) entity.nom = input.nom;
    if (input.description !== undefined) entity.description = input.description || null;
    if (input.siret !== undefined) entity.siret = input.siret || null;
    if (input.adresse !== undefined) entity.adresse = input.adresse || null;
    if (input.telephone !== undefined) entity.telephone = input.telephone || null;
    if (input.email !== undefined) entity.email = input.email || null;
    if (input.actif !== undefined) entity.actif = input.actif;
    if (input.etat !== undefined) entity.etat = input.etat;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<OrganisationEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Organisation ${id} not found` });
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string; actif?: boolean },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    organisations: OrganisationEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const queryBuilder = this.repository.createQueryBuilder('o');

    if (filters?.search) {
      queryBuilder.where('(o.nom ILIKE :search OR o.email ILIKE :search)', { search: `%${filters.search}%` });
    }

    if (filters?.actif !== undefined) {
      queryBuilder.andWhere('o.actif = :actif', { actif: filters.actif });
    }

    const [organisations, total] = await queryBuilder
      .orderBy('o.nom', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { organisations, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
