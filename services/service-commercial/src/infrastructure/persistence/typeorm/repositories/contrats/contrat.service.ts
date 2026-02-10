import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ContratEntity } from '../../../../../domain/contrats/entities/contrat.entity';
import {
  CalendarGrpcClient,
  calculateNextDebitDate,
} from '../../../../grpc/calendar/calendar-grpc-client';

/** Contrat entity enriched with debit date fields from calendar service */
export interface EnrichedContrat extends ContratEntity {
  jour_prelevement?: number | null;
  prochaine_date_prelevement?: string | null;
}

@Injectable()
export class ContratService {
  private readonly logger = new Logger(ContratService.name);
  private calendarClient: CalendarGrpcClient | null = null;

  constructor(
    @InjectRepository(ContratEntity)
    private readonly repository: Repository<ContratEntity>,
  ) {
    try {
      this.calendarClient = new CalendarGrpcClient();
    } catch (error) {
      this.logger.warn(
        `Calendar gRPC client initialization failed: ${(error as Error).message}. Debit date enrichment disabled.`,
      );
    }
  }

  /**
   * Enrich a single contrat entity with jour_prelevement + prochaine_date_prelevement
   * from the calendar service. Non-blocking: returns original entity on failure.
   */
  private async enrichWithDebitDate(entity: ContratEntity): Promise<EnrichedContrat> {
    const enriched = entity as EnrichedContrat;
    enriched.jour_prelevement = null;
    enriched.prochaine_date_prelevement = null;

    if (!this.calendarClient) return enriched;

    try {
      const config = await this.calendarClient.getContractConfig(
        entity.organisationId,
        entity.id,
      );
      if (config && config.fixed_day > 0) {
        enriched.jour_prelevement = config.fixed_day;
        enriched.prochaine_date_prelevement = calculateNextDebitDate(config.fixed_day);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to enrich contrat ${entity.id} with debit date: ${(error as Error).message}`,
      );
    }

    return enriched;
  }

  /**
   * Enrich multiple contrats with debit date info.
   * Calls calendar service in parallel for all contrats.
   */
  private async enrichManyWithDebitDate(entities: ContratEntity[]): Promise<EnrichedContrat[]> {
    return Promise.all(entities.map((e) => this.enrichWithDebitDate(e)));
  }

  /**
   * Create or update calendar debit config for a contrat.
   * Non-blocking: logs warning on failure, never throws.
   */
  private async upsertDebitConfig(
    organisationId: string,
    contratId: string,
    jourPrelevement: number,
  ): Promise<void> {
    if (!this.calendarClient) return;

    try {
      const existing = await this.calendarClient.getContractConfig(organisationId, contratId);
      if (existing) {
        await this.calendarClient.updateContractConfig(existing.id, jourPrelevement);
        this.logger.log(
          `Updated debit config ${existing.id} for contrat ${contratId} → day ${jourPrelevement}`,
        );
      } else {
        await this.calendarClient.createContractConfig({
          organisationId,
          contratId,
          fixedDay: jourPrelevement,
        });
        this.logger.log(
          `Created debit config for contrat ${contratId} → day ${jourPrelevement}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to upsert debit config for contrat ${contratId}: ${(error as Error).message}`,
      );
    }
  }

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
    jourPrelevement?: number;
  }): Promise<EnrichedContrat> {
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
    const saved = await this.repository.save(entity);

    // Create calendar debit config if jour_prelevement provided
    if (input.jourPrelevement && input.jourPrelevement > 0) {
      await this.upsertDebitConfig(input.organisationId, saved.id, input.jourPrelevement);
    }

    return this.enrichWithDebitDate(saved);
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
    jourPrelevement?: number;
  }): Promise<EnrichedContrat> {
    const entity = await this.findByIdRaw(input.id);

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

    const saved = await this.repository.save(entity);

    // Create or update calendar debit config if jour_prelevement provided
    if (input.jourPrelevement !== undefined && input.jourPrelevement > 0) {
      await this.upsertDebitConfig(entity.organisationId, entity.id, input.jourPrelevement);
    }

    return this.enrichWithDebitDate(saved);
  }

  async findById(id: string): Promise<EnrichedContrat> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Contrat ${id} not found` });
    }
    return this.enrichWithDebitDate(entity);
  }

  /** Internal findById without enrichment (used by update to avoid double-enrichment) */
  private async findByIdRaw(id: string): Promise<ContratEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Contrat ${id} not found` });
    }
    return entity;
  }

  async findByIdWithDetails(id: string): Promise<EnrichedContrat> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['lignes', 'historique'],
    });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Contrat ${id} not found` });
    }
    return this.enrichWithDebitDate(entity);
  }

  async findByReference(organisationId: string, reference: string): Promise<EnrichedContrat> {
    const entity = await this.repository.findOne({
      where: { organisationId, reference },
    });
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Contrat with reference ${reference} not found`,
      });
    }
    return this.enrichWithDebitDate(entity);
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
    contrats: EnrichedContrat[];
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

    const enrichedContrats = await this.enrichManyWithDebitDate(contrats);

    return { contrats: enrichedContrats, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async updateStatus(id: string, statut: string): Promise<EnrichedContrat> {
    const entity = await this.findByIdRaw(id);
    entity.statut = statut;
    const saved = await this.repository.save(entity);
    return this.enrichWithDebitDate(saved);
  }
}
