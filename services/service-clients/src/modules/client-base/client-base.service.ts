import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ClientBaseEntity } from './entities/client-base.entity';

interface ClientBaseFilters {
  organisationId: string;
  statutId?: string;
  societeId?: string;
  search?: string;
}

@Injectable()
export class ClientBaseService {
  private readonly logger = new Logger(ClientBaseService.name);

  constructor(
    @InjectRepository(ClientBaseEntity)
    private readonly repository: Repository<ClientBaseEntity>,
  ) {}

  async create(input: {
    organisationId: string;
    typeClient: string;
    nom: string;
    prenom: string;
    dateNaissance?: string;
    compteCode: string;
    partenaireId: string;
    telephone: string;
    email?: string;
    statut?: string;
  }): Promise<ClientBaseEntity> {
    // Check for duplicates by phone + name
    const existing = await this.findByPhoneAndName(input.telephone, input.nom);
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Client with phone ${input.telephone} and name ${input.nom} already exists`,
      });
    }

    const entity = this.repository.create({
      organisationId: input.organisationId,
      typeClient: input.typeClient,
      nom: ClientBaseEntity.capitalizeName(input.nom),
      prenom: ClientBaseEntity.capitalizeName(input.prenom),
      dateNaissance: input.dateNaissance ? new Date(input.dateNaissance) : null,
      compteCode: input.compteCode,
      partenaireId: input.partenaireId,
      dateCreation: new Date(),
      telephone: input.telephone,
      email: input.email || null,
      statut: input.statut || 'ACTIF',
    });

    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    typeClient?: string;
    nom?: string;
    prenom?: string;
    dateNaissance?: string;
    compteCode?: string;
    partenaireId?: string;
    telephone?: string;
    email?: string;
    statut?: string;
  }): Promise<ClientBaseEntity> {
    const entity = await this.findById(input.id);

    if (input.typeClient !== undefined) entity.typeClient = input.typeClient;
    if (input.nom !== undefined) entity.nom = ClientBaseEntity.capitalizeName(input.nom);
    if (input.prenom !== undefined) entity.prenom = ClientBaseEntity.capitalizeName(input.prenom);
    if (input.dateNaissance !== undefined) entity.dateNaissance = input.dateNaissance ? new Date(input.dateNaissance) : null;
    if (input.compteCode !== undefined) entity.compteCode = input.compteCode;
    if (input.partenaireId !== undefined) entity.partenaireId = input.partenaireId;
    if (input.telephone !== undefined) entity.telephone = input.telephone;
    if (input.email !== undefined) entity.email = input.email || null;
    if (input.statut !== undefined) entity.statut = input.statut;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<ClientBaseEntity> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['adresses'],
    });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Client ${id} not found` });
    }
    return entity;
  }

  async findByPhoneAndName(telephone: string, nom: string): Promise<ClientBaseEntity | null> {
    return this.repository.findOne({
      where: { telephone, nom: ClientBaseEntity.capitalizeName(nom) },
    });
  }

  async findAll(
    filters: ClientBaseFilters,
    pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string },
  ): Promise<{
    clients: ClientBaseEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const qb = this.repository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.adresses', 'adresses')
      .where('c.organisationId = :orgId', { orgId: filters.organisationId });

    if (filters.statutId) {
      qb.andWhere('c.statut = :statut', { statut: filters.statutId });
    }

    if (filters.search) {
      qb.andWhere(
        '(LOWER(c.nom) LIKE LOWER(:search) OR LOWER(c.prenom) LIKE LOWER(:search) OR c.telephone LIKE :search OR LOWER(c.email) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }

    const [clients, total] = await qb
      .orderBy(`c.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { clients, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async search(organisationId: string, telephone: string, nom: string): Promise<{ found: boolean; client: ClientBaseEntity | null }> {
    const client = await this.repository.findOne({
      where: {
        organisationId,
        telephone,
        nom: ClientBaseEntity.capitalizeName(nom),
      },
      relations: ['adresses'],
    });
    return { found: !!client, client };
  }
}
