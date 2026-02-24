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
    const inputData = input as any;
    const organisationId = inputData.organisationId || input.organisation_id;
    const existing = await this.findByPhoneAndName(input.telephone, input.nom, organisationId);
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Client with phone ${input.telephone} and name ${input.nom} already exists`,
      });
    }

    const entity = this.repository.create({
      organisationId,
      typeClient: inputData.typeClient || input.type_client,
      nom: ClientBaseEntity.capitalizeName(input.nom),
      prenom: ClientBaseEntity.capitalizeName(input.prenom),
      dateNaissance: (inputData.dateNaissance || input.date_naissance) ? new Date(inputData.dateNaissance || input.date_naissance) : null,
      compteCode: inputData.compteCode || input.compte_code,
      partenaireId: inputData.partenaireId || input.partenaire_id,
      dateCreation: new Date(),
      telephone: input.telephone,
      email: input.email,
      statut: input.statut || 'ACTIF',
      societeId: inputData.societeId || input.societe_id,
      source: input.source,
      canalAcquisition: inputData.canalAcquisition ?? input.canal_acquisition ?? null,
      civilite: input.civilite ?? null,
      iban: input.iban ?? null,
      bic: input.bic ?? null,
      mandatSepa: inputData.mandatSepa ?? input.mandat_sepa ?? null,
      csp: input.csp ?? null,
      regimeSocial: inputData.regimeSocial ?? input.regime_social ?? null,
      lieuNaissance: inputData.lieuNaissance ?? input.lieu_naissance ?? null,
      paysNaissance: inputData.paysNaissance ?? input.pays_naissance ?? null,
      etapeCourante: inputData.etapeCourante ?? input.etape_courante ?? null,
      isPoliticallyExposed: inputData.isPoliticallyExposed ?? input.is_politically_exposed ?? null,
      numss: input.numss ?? null,
    });

    return this.repository.save(entity);
  }

  async update(input: UpdateClientBaseRequest): Promise<ClientBaseEntity> {
    const inputData = input as any;
    const entity = await this.findById(input.id);

    const typeClient = inputData.typeClient ?? input.type_client;
    if (typeClient !== undefined) entity.typeClient = typeClient;
    if (input.nom !== undefined) entity.nom = ClientBaseEntity.capitalizeName(input.nom);
    if (input.prenom !== undefined) entity.prenom = ClientBaseEntity.capitalizeName(input.prenom);
    const dateNaissance = inputData.dateNaissance ?? input.date_naissance;
    if (dateNaissance !== undefined) entity.dateNaissance = dateNaissance ? new Date(dateNaissance) : null;
    const compteCode = inputData.compteCode ?? input.compte_code;
    if (compteCode !== undefined) entity.compteCode = compteCode;
    const partenaireId = inputData.partenaireId ?? input.partenaire_id;
    if (partenaireId !== undefined) entity.partenaireId = partenaireId;
    if (input.telephone !== undefined) entity.telephone = input.telephone;
    if (input.email !== undefined) entity.email = input.email;
    if (input.statut !== undefined) entity.statut = input.statut;
    const societeId = inputData.societeId ?? input.societe_id;
    if (societeId !== undefined) entity.societeId = societeId;
    if (input.source !== undefined) entity.source = input.source;
    const canalAcquisition = inputData.canalAcquisition ?? input.canal_acquisition;
    if (canalAcquisition !== undefined) entity.canalAcquisition = canalAcquisition;
    if (input.civilite !== undefined) entity.civilite = input.civilite;
    if (input.iban !== undefined) entity.iban = input.iban;
    if (input.bic !== undefined) entity.bic = input.bic;
    const mandatSepa = inputData.mandatSepa ?? input.mandat_sepa;
    if (mandatSepa !== undefined) entity.mandatSepa = mandatSepa;
    if (input.csp !== undefined) entity.csp = input.csp;
    const regimeSocial = inputData.regimeSocial ?? input.regime_social;
    if (regimeSocial !== undefined) entity.regimeSocial = regimeSocial;
    const lieuNaissance = inputData.lieuNaissance ?? input.lieu_naissance;
    if (lieuNaissance !== undefined) entity.lieuNaissance = lieuNaissance;
    const paysNaissance = inputData.paysNaissance ?? input.pays_naissance;
    if (paysNaissance !== undefined) entity.paysNaissance = paysNaissance;
    const etapeCourante = inputData.etapeCourante ?? input.etape_courante;
    if (etapeCourante !== undefined) entity.etapeCourante = etapeCourante;
    const isPoliticallyExposed = inputData.isPoliticallyExposed ?? input.is_politically_exposed;
    if (isPoliticallyExposed !== undefined) entity.isPoliticallyExposed = isPoliticallyExposed;
    if (input.numss !== undefined) entity.numss = input.numss;

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

  async findByPhoneAndName(telephone: string, nom: string, organisationId?: string): Promise<ClientBaseEntity | null> {
    const where: Record<string, unknown> = { telephone, nom: ClientBaseEntity.capitalizeName(nom) };
    if (organisationId) {
      where.organisationId = organisationId;
    }
    return this.repository.findOne({ where: where as any });
  }

  async findAll(
    request: ListClientsBaseRequest,
  ): Promise<{
    clients: ClientBaseEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const requestData = request as any;
    const page = request.pagination?.page ?? 1;
    const limit = request.pagination?.limit ?? 20;
    const sortBy = (request.pagination as any)?.sortBy || request.pagination?.sort_by || 'createdAt';
    const sortOrder = (((request.pagination as any)?.sortOrder || request.pagination?.sort_order)?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const orgId = requestData.organisationId || request.organisation_id;
    const statutId = requestData.statutId || request.statut_id;
    const societeId = requestData.societeId || request.societe_id;

    const qb = this.repository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.adresses', 'adresses')
      .where('c.organisationId = :orgId', { orgId });

    if (statutId) {
      qb.andWhere('c.statut = :statut', { statut: statutId });
    }

    if (societeId) {
      qb.andWhere('c.societeId = :societeId', { societeId });
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
    const where: Record<string, unknown> = {
      organisationId: organisation_id,
      telephone,
    };
    if (nom && nom.trim()) {
      where.nom = ClientBaseEntity.capitalizeName(nom);
    }
    const client = await this.repository.findOne({
      where: where as any,
      relations: ['adresses'],
    });
    return { found: !!client, client };
  }
}
