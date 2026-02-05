import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ContratEntity } from '../../../../../domain/contrats/entities/contrat.entity';

@Injectable()
export class ContratService {
  private readonly logger = new Logger(ContratService.name);

  constructor(
    @InjectRepository(ContratEntity)
    private readonly repository: Repository<ContratEntity>,
  ) {}

  async create(input: {
    organisationId: string;
    reference: string;
    titre?: string;
    description?: string;
    type?: string;
    statut: string;
    dateDebut: string;
    dateFin?: string;
    dateSignature?: string;
    montant?: number;
    devise?: string;
    frequenceFacturation?: string;
    documentUrl?: string;
    fournisseur?: string;
    clientId: string;
    commercialId: string;
    societeId?: string;
    notes?: string;
  }): Promise<ContratEntity> {
    const existing = await this.repository.findOne({
      where: { organisationId: input.organisationId, reference: input.reference },
    });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Contrat with reference ${input.reference} already exists`,
      });
    }

    const entity = this.repository.create({
      organisationId: input.organisationId,
      reference: input.reference,
      titre: input.titre || null,
      description: input.description || null,
      type: input.type || null,
      statut: input.statut,
      dateDebut: input.dateDebut,
      dateFin: input.dateFin || null,
      dateSignature: input.dateSignature || null,
      montant: input.montant ?? null,
      devise: input.devise || 'EUR',
      frequenceFacturation: input.frequenceFacturation || null,
      documentUrl: input.documentUrl || null,
      fournisseur: input.fournisseur || null,
      clientId: input.clientId,
      commercialId: input.commercialId,
      societeId: input.societeId || null,
      notes: input.notes || null,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    reference?: string;
    titre?: string;
    description?: string;
    type?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
    dateSignature?: string;
    montant?: number;
    devise?: string;
    frequenceFacturation?: string;
    documentUrl?: string;
    fournisseur?: string;
    clientId?: string;
    commercialId?: string;
    societeId?: string;
    notes?: string;
  }): Promise<ContratEntity> {
    const entity = await this.findById(input.id);

    if (input.reference !== undefined) entity.reference = input.reference;
    if (input.titre !== undefined) entity.titre = input.titre || null;
    if (input.description !== undefined) entity.description = input.description || null;
    if (input.type !== undefined) entity.type = input.type || null;
    if (input.statut !== undefined) entity.statut = input.statut;
    if (input.dateDebut !== undefined) entity.dateDebut = input.dateDebut;
    if (input.dateFin !== undefined) entity.dateFin = input.dateFin || null;
    if (input.dateSignature !== undefined) entity.dateSignature = input.dateSignature || null;
    if (input.montant !== undefined) entity.montant = input.montant;
    if (input.devise !== undefined) entity.devise = input.devise;
    if (input.frequenceFacturation !== undefined) entity.frequenceFacturation = input.frequenceFacturation || null;
    if (input.documentUrl !== undefined) entity.documentUrl = input.documentUrl || null;
    if (input.fournisseur !== undefined) entity.fournisseur = input.fournisseur || null;
    if (input.clientId !== undefined) entity.clientId = input.clientId;
    if (input.commercialId !== undefined) entity.commercialId = input.commercialId;
    if (input.societeId !== undefined) entity.societeId = input.societeId || null;
    if (input.notes !== undefined) entity.notes = input.notes || null;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<ContratEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Contrat ${id} not found` });
    }
    return entity;
  }

  async findByIdWithDetails(id: string): Promise<ContratEntity> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['lignes', 'historique'],
    });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Contrat ${id} not found` });
    }
    return entity;
  }

  async findByReference(organisationId: string, reference: string): Promise<ContratEntity> {
    const entity = await this.repository.findOne({
      where: { organisationId, reference },
    });
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Contrat with reference ${reference} not found`,
      });
    }
    return entity;
  }

  async findAll(
    filters?: {
      organisationId?: string;
      clientId?: string;
      commercialId?: string;
      societeId?: string;
      statut?: string;
      search?: string;
    },
    pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string },
  ): Promise<{
    contrats: ContratEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const where: FindOptionsWhere<ContratEntity> = {};
    if (filters?.organisationId) where.organisationId = filters.organisationId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.commercialId) where.commercialId = filters.commercialId;
    if (filters?.societeId) where.societeId = filters.societeId;
    if (filters?.statut) where.statut = filters.statut;
    if (filters?.search) where.reference = Like(`%${filters.search}%`);

    const [contrats, total] = await this.repository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { contrats, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async updateStatus(id: string, statut: string): Promise<ContratEntity> {
    const entity = await this.findById(id);
    entity.statut = statut;
    return this.repository.save(entity);
  }
}
