import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CasJuridique,
  CasJuridiqueStatut,
  CasJuridiqueType,
  CasJuridiquePriorite,
} from '../../../../../domain/services/entities/cas-juridique.entity';
import { ICasJuridiqueRepository } from '../../../../../domain/services/repositories/ICasJuridiqueRepository';

export interface CreateCasJuridiqueInput {
  organisationId: string;
  clientId: string;
  reference: string;
  titre: string;
  description?: string;
  type?: CasJuridiqueType;
  statut?: CasJuridiqueStatut;
  priorite?: CasJuridiquePriorite;
  avocatId?: string;
  assigneA?: string;
  creePar?: string;
  montantEnjeu?: number;
  montantProvision?: number;
  dateOuverture?: Date;
  dateAudience?: Date;
  dateCloture?: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class CasJuridiqueRepository implements ICasJuridiqueRepository {
  private readonly logger = new Logger(CasJuridiqueRepository.name);

  constructor(
    @InjectRepository(CasJuridique)
    private readonly repository: Repository<CasJuridique>,
  ) {}

  async findById(id: string): Promise<CasJuridique | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByReference(reference: string): Promise<CasJuridique | null> {
    return this.repository.findOne({ where: { reference } });
  }

  async findAll(
    filters?: {
      organisationId?: string;
      clientId?: string;
      statut?: CasJuridiqueStatut;
      type?: CasJuridiqueType;
      priorite?: CasJuridiquePriorite;
      search?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: CasJuridique[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;

    const qb = this.repository.createQueryBuilder('c');

    if (filters?.organisationId) {
      qb.andWhere('c.organisation_id = :organisationId', {
        organisationId: filters.organisationId,
      });
    }

    if (filters?.clientId) {
      qb.andWhere('c.client_id = :clientId', { clientId: filters.clientId });
    }

    if (filters?.statut) {
      qb.andWhere('c.statut = :statut', { statut: filters.statut });
    }

    if (filters?.type) {
      qb.andWhere('c.type = :type', { type: filters.type });
    }

    if (filters?.priorite) {
      qb.andWhere('c.priorite = :priorite', { priorite: filters.priorite });
    }

    if (filters?.search) {
      qb.andWhere('(c.titre ILIKE :search OR c.description ILIKE :search OR c.reference ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    qb.orderBy('c.created_at', 'DESC');

    const total = await qb.getCount();
    const totalPages = Math.ceil(total / limit);

    qb.skip((page - 1) * limit).take(limit);

    const data = await qb.getMany();

    return { data, total, page, limit, totalPages };
  }

  async findByClient(
    clientId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: CasJuridique[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.findAll({ clientId }, pagination);
  }

  async create(input: CreateCasJuridiqueInput): Promise<CasJuridique> {
    const entity = this.repository.create({
      organisationId: input.organisationId,
      clientId: input.clientId,
      reference: input.reference,
      titre: input.titre,
      description: input.description,
      type: input.type ?? CasJuridiqueType.AUTRE,
      statut: input.statut ?? CasJuridiqueStatut.OUVERT,
      priorite: input.priorite ?? CasJuridiquePriorite.NORMALE,
      avocatId: input.avocatId,
      assigneA: input.assigneA,
      creePar: input.creePar,
      montantEnjeu: input.montantEnjeu,
      montantProvision: input.montantProvision,
      dateOuverture: input.dateOuverture,
      dateAudience: input.dateAudience,
      dateCloture: input.dateCloture,
      metadata: input.metadata,
    } as Partial<CasJuridique>) as CasJuridique;

    const saved = await this.repository.save(entity);
    this.logger.log(`Created CasJuridique ${saved.id} (ref=${saved.reference})`);
    return saved;
  }

  async save(entity: CasJuridique): Promise<CasJuridique> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    if (!entity) {
      return false;
    }
    await this.repository.remove(entity);
    this.logger.log(`Deleted CasJuridique ${id}`);
    return true;
  }
}
