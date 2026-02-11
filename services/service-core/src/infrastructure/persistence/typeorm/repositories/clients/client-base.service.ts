import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ClientBaseEntity } from '../../../../../domain/clients/entities';
import type {
  CreateClientBaseRequest,
  UpdateClientBaseRequest,
  ListClientsBaseRequest,
} from '@proto/clients';

@Injectable()
export class ClientBaseService {
  private readonly logger = new Logger(ClientBaseService.name);

  constructor(
    @InjectRepository(ClientBaseEntity)
    private readonly repository: Repository<ClientBaseEntity>,
  ) {}

  async create(input: CreateClientBaseRequest): Promise<ClientBaseEntity> {
    const existing = await this.findByPhoneAndName(input.telephone, input.nom);
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Client with phone ${input.telephone} and name ${input.nom} already exists`,
      });
    }

    const entity = this.repository.create({
      organisationId: input.organisation_id,
      typeClient: input.type_client,
      nom: ClientBaseEntity.capitalizeName(input.nom),
      prenom: ClientBaseEntity.capitalizeName(input.prenom),
      dateNaissance: input.date_naissance ? new Date(input.date_naissance) : null,
      compteCode: input.compte_code,
      partenaireId: input.partenaire_id,
      dateCreation: new Date(),
      telephone: input.telephone,
      email: input.email,
      statut: input.statut || 'ACTIF',
      societeId: input.societe_id,
      source: input.source,
    });

    return this.repository.save(entity);
  }

  async update(input: UpdateClientBaseRequest): Promise<ClientBaseEntity> {
    const entity = await this.findById(input.id);

    if (input.type_client !== undefined) entity.typeClient = input.type_client;
    if (input.nom !== undefined) entity.nom = ClientBaseEntity.capitalizeName(input.nom);
    if (input.prenom !== undefined) entity.prenom = ClientBaseEntity.capitalizeName(input.prenom);
    if (input.date_naissance !== undefined) entity.dateNaissance = input.date_naissance ? new Date(input.date_naissance) : null;
    if (input.compte_code !== undefined) entity.compteCode = input.compte_code;
    if (input.partenaire_id !== undefined) entity.partenaireId = input.partenaire_id;
    if (input.telephone !== undefined) entity.telephone = input.telephone;
    if (input.email !== undefined) entity.email = input.email;
    if (input.statut !== undefined) entity.statut = input.statut;
    if (input.societe_id !== undefined) entity.societeId = input.societe_id;
    if (input.source !== undefined) entity.source = input.source;

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
    request: ListClientsBaseRequest,
  ): Promise<{
    clients: ClientBaseEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = request.pagination?.page ?? 1;
    const limit = request.pagination?.limit ?? 20;
    const sortBy = request.pagination?.sort_by || 'createdAt';
    const sortOrder = (request.pagination?.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const qb = this.repository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.adresses', 'adresses')
      .where('c.organisationId = :orgId', { orgId: request.organisation_id });

    if (request.statut_id) {
      qb.andWhere('c.statut = :statut', { statut: request.statut_id });
    }

    if (request.societe_id) {
      qb.andWhere('c.societeId = :societeId', { societeId: request.societe_id });
    }

    if (request.source) {
      qb.andWhere('c.source = :source', { source: request.source });
    }

    if (request.search) {
      qb.andWhere(
        '(LOWER(c.nom) LIKE LOWER(:search) OR LOWER(c.prenom) LIKE LOWER(:search) OR c.telephone LIKE :search OR LOWER(c.email) LIKE LOWER(:search))',
        { search: `%${request.search}%` },
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

  async search(organisation_id: string, telephone: string, nom: string): Promise<{ found: boolean; client: ClientBaseEntity | null }> {
    const client = await this.repository.findOne({
      where: {
        organisationId: organisation_id,
        telephone,
        nom: ClientBaseEntity.capitalizeName(nom),
      },
      relations: ['adresses'],
    });
    return { found: !!client, client };
  }
}
