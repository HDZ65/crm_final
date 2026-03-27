import { status } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import type { CreateClientBaseRequest, ListClientsBaseRequest, UpdateClientBaseRequest } from '@proto/clients';
import type { FindOptionsWhere } from 'typeorm';
import { Repository } from 'typeorm';
import { ClientBaseEntity } from '../../../../../domain/clients/entities';
import {
  type PaginationOutput,
  normalizePagination,
} from '../../../../../types/client-input.types';

@Injectable()
export class ClientBaseService {
  constructor(
    @InjectRepository(ClientBaseEntity)
    private readonly repository: Repository<ClientBaseEntity>,
  ) {}

  async create(input: CreateClientBaseRequest): Promise<ClientBaseEntity> {
    const identity = input.identity;
    const contact = input.contact;
    const banking = input.banking;
    const compliance = input.compliance;
    const acquisition = input.acquisition;

    const telephone = contact?.telephone ?? '';
    const nom = identity?.nom ?? '';
    const keycloakGroupId = input.organisationId;

    const existing = await this.findByPhoneAndName(telephone, nom, keycloakGroupId);
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Client with phone ${telephone} and name ${nom} already exists`,
      });
    }

    const entity = this.repository.create({
      keycloakGroupId,
      typeClient: input.typeClient?.toString() ?? '',
      nom: ClientBaseEntity.capitalizeName(nom),
      prenom: ClientBaseEntity.capitalizeName(identity?.prenom ?? ''),
      telephone,
      email: contact?.email ?? null,
      statut: input.statut ?? 'ACTIF',
      compteCode: input.compteCode ?? '',
      partenaireId: input.partenaireId ?? '',
      // Identity fields
      dateNaissance: identity?.dateNaissance ? new Date((identity.dateNaissance as any).seconds * 1000) : null,
      civilite: identity?.civilite?.toString() ?? null,
      lieuNaissance: identity?.lieuNaissance ?? null,
      paysNaissance: identity?.paysNaissance ?? null,
      csp: identity?.csp ?? null,
      regimeSocial: identity?.regimeSocial ?? null,
      // Banking fields
      iban: banking?.iban ?? null,
      bic: banking?.bic ?? null,
      mandatSepa: banking?.mandatSepa ?? null,
      // Compliance fields
      isPoliticallyExposed: compliance?.isPoliticallyExposed ?? null,
      numss: compliance?.numss ?? null,
      // Acquisition fields
      source: acquisition?.source ?? null,
      canalAcquisition: acquisition?.canalAcquisition ?? null,
      etapeCourante: acquisition?.etapeCourante ?? null,
      dateCreation: new Date(),
    });

    return this.repository.save(entity);
  }

  async update(input: UpdateClientBaseRequest): Promise<ClientBaseEntity> {
    const entity = await this.findById(input.id);

    const identity = input.identity;
    const contact = input.contact;
    const banking = input.banking;
    const compliance = input.compliance;
    const acquisition = input.acquisition;

    if (input.typeClient !== undefined) entity.typeClient = input.typeClient.toString();
    if (input.statut !== undefined) entity.statut = input.statut;
    if (input.compteCode !== undefined) entity.compteCode = input.compteCode;
    if (input.partenaireId !== undefined) entity.partenaireId = input.partenaireId;

    if (identity) {
      if (identity.nom !== undefined) entity.nom = ClientBaseEntity.capitalizeName(identity.nom);
      if (identity.prenom !== undefined) entity.prenom = ClientBaseEntity.capitalizeName(identity.prenom);
      if (identity.dateNaissance !== undefined) {
        entity.dateNaissance = identity.dateNaissance
          ? new Date((identity.dateNaissance as any).seconds * 1000)
          : null;
      }
      if (identity.civilite !== undefined) entity.civilite = identity.civilite.toString();
      if (identity.lieuNaissance !== undefined) entity.lieuNaissance = identity.lieuNaissance;
      if (identity.paysNaissance !== undefined) entity.paysNaissance = identity.paysNaissance;
      if (identity.csp !== undefined) entity.csp = identity.csp;
      if (identity.regimeSocial !== undefined) entity.regimeSocial = identity.regimeSocial;
    }

    if (contact) {
      if (contact.telephone !== undefined) entity.telephone = contact.telephone;
      if (contact.email !== undefined) entity.email = contact.email;
    }

    if (banking) {
      if (banking.iban !== undefined) entity.iban = banking.iban;
      if (banking.bic !== undefined) entity.bic = banking.bic;
      if (banking.mandatSepa !== undefined) entity.mandatSepa = banking.mandatSepa;
    }

    if (compliance) {
      if (compliance.isPoliticallyExposed !== undefined) entity.isPoliticallyExposed = compliance.isPoliticallyExposed;
      if (compliance.numss !== undefined) entity.numss = compliance.numss;
    }

    if (acquisition) {
      if (acquisition.source !== undefined) entity.source = acquisition.source;
      if (acquisition.canalAcquisition !== undefined) entity.canalAcquisition = acquisition.canalAcquisition;
      if (acquisition.etapeCourante !== undefined) entity.etapeCourante = acquisition.etapeCourante;
    }

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

  async findByPhoneAndName(
    telephone: string,
    nom: string,
    keycloakGroupId?: string,
  ): Promise<ClientBaseEntity | null> {
    const where: FindOptionsWhere<ClientBaseEntity> = {
      telephone,
      nom: ClientBaseEntity.capitalizeName(nom),
    };
    if (keycloakGroupId) {
      where.keycloakGroupId = keycloakGroupId;
    }
    return this.repository.findOne({ where });
  }

  async findAll(request: ListClientsBaseRequest): Promise<{
    clients: ClientBaseEntity[];
    pagination: PaginationOutput;
  }> {
    const { page, limit, sortBy, sortOrder } = normalizePagination(
      request.pagination
        ? {
            page: request.pagination.page,
            limit: request.pagination.limit,
            sort_by: request.pagination.sortBy,
            sort_order: request.pagination.sortOrder,
          }
        : undefined,
    );

    // PERFORMANCE: Limite maximale pour éviter memory exhaustion
    const safeLimitMax = 500;
    const safeLimit = Math.min(limit, safeLimitMax);

    const orgId = request.organisationId;
    const statutId = request.statutId;

    // PERFORMANCE: Requête légère sans les adresses (lazy loading)
    // Les adresses seront chargées à la demande via findById
    const qb = this.repository
      .createQueryBuilder('c')
      .select([
        'c.id',
        'c.keycloakGroupId',
        'c.typeClient',
        'c.nom',
        'c.prenom',
        'c.telephone',
        'c.email',
        'c.statut',
        'c.source',
        'c.canalAcquisition',
        'c.civilite',
        'c.dateCreation',
        'c.createdAt',
        'c.updatedAt',
      ])
      .where('c.keycloakGroupId = :orgId', { orgId });

    if (statutId) {
      qb.andWhere('c.statut = :statut', { statut: statutId });
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
      .skip((page - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();

    return { clients, pagination: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async search(
    organisationId: string,
    telephone: string,
    nom: string,
  ): Promise<{ found: boolean; client: ClientBaseEntity | null }> {
    const where: FindOptionsWhere<ClientBaseEntity> = {
      keycloakGroupId: organisationId,
      telephone,
    };
    if (nom?.trim()) {
      where.nom = ClientBaseEntity.capitalizeName(nom);
    }
    const client = await this.repository.findOne({
      where,
      relations: ['adresses'],
    });
    return { found: !!client, client };
  }
}
