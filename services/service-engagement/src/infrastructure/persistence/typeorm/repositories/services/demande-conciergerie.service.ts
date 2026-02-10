import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import {
  DemandeConciergerie,
  DemandeStatut,
  DemandeCategorie,
  DemandePriorite,
  DemandeCanal,
} from '../../../../../domain/services/entities/demande-conciergerie.entity';
import { IDemandeConciergerieRepository } from '../../../../../domain/services/repositories/IDemandeConciergerieRepository';
import { randomUUID as uuid } from 'crypto';

/**
 * SLA delays by priority level (in milliseconds).
 */
export const SLA_DELAYS: Record<DemandePriorite, number> = {
  [DemandePriorite.URGENTE]: 4 * 60 * 60 * 1000,    // 4 hours
  [DemandePriorite.HAUTE]: 24 * 60 * 60 * 1000,      // 24 hours
  [DemandePriorite.NORMALE]: 48 * 60 * 60 * 1000,    // 48 hours
  [DemandePriorite.BASSE]: 72 * 60 * 60 * 1000,      // 72 hours
};

export interface CreateDemandeInput {
  organisationId: string;
  clientId: string;
  objet: string;
  description?: string;
  categorie?: DemandeCategorie;
  canal?: DemandeCanal;
  priorite?: DemandePriorite;
  creePar?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class DemandeConciergerieService implements IDemandeConciergerieRepository {
  private readonly logger = new Logger(DemandeConciergerieService.name);

  constructor(
    @InjectRepository(DemandeConciergerie)
    private readonly repository: Repository<DemandeConciergerie>,
  ) {}

  async findById(id: string): Promise<DemandeConciergerie | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByReference(reference: string): Promise<DemandeConciergerie | null> {
    return this.repository.findOne({ where: { reference } });
  }

  async findAll(
    filters?: {
      organisationId?: string;
      clientId?: string;
      statut?: DemandeStatut;
      categorie?: DemandeCategorie;
      priorite?: DemandePriorite;
      assigneA?: string;
      search?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: DemandeConciergerie[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;

    const qb = this.repository.createQueryBuilder('d');

    if (filters?.organisationId) {
      qb.andWhere('d.organisation_id = :organisationId', {
        organisationId: filters.organisationId,
      });
    }

    if (filters?.clientId) {
      qb.andWhere('d.client_id = :clientId', { clientId: filters.clientId });
    }

    if (filters?.statut) {
      qb.andWhere('d.statut = :statut', { statut: filters.statut });
    }

    if (filters?.categorie) {
      qb.andWhere('d.categorie = :categorie', { categorie: filters.categorie });
    }

    if (filters?.priorite) {
      qb.andWhere('d.priorite = :priorite', { priorite: filters.priorite });
    }

    if (filters?.assigneA) {
      qb.andWhere('d.assigne_a = :assigneA', { assigneA: filters.assigneA });
    }

    if (filters?.search) {
      qb.andWhere(
        '(d.objet ILIKE :search OR d.description ILIKE :search OR d.reference ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('d.created_at', 'DESC');

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
    data: DemandeConciergerie[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.findAll({ clientId }, pagination);
  }

  /**
   * Create a new demande with automatic SLA deadline calculation.
   */
  async create(input: CreateDemandeInput): Promise<DemandeConciergerie> {
    const priorite = input.priorite ?? DemandePriorite.NORMALE;
    const now = new Date();
    const dateLimite = this.calculateDateLimite(now, priorite);

    const entity = this.repository.create({
      organisationId: input.organisationId,
      clientId: input.clientId,
      reference: `CONC-${uuid().substring(0, 8).toUpperCase()}`,
      objet: input.objet,
      description: input.description,
      categorie: input.categorie ?? DemandeCategorie.AUTRE,
      canal: input.canal ?? DemandeCanal.PORTAIL,
      priorite,
      statut: DemandeStatut.NOUVELLE,
      creePar: input.creePar,
      dateLimite,
      metadata: input.metadata,
    } as Partial<DemandeConciergerie>) as DemandeConciergerie;

    const saved = await this.repository.save(entity);
    this.logger.log(`Created DemandeConciergerie ${saved.id} (ref=${saved.reference}, sla=${dateLimite.toISOString()})`);
    return saved;
  }

  /**
   * Update a demande. If dateResolution is being set, check SLA compliance.
   */
  async update(id: string, data: Partial<DemandeConciergerie>): Promise<DemandeConciergerie> {
    const demande = await this.findById(id);
    if (!demande) {
      throw new NotFoundException(`DemandeConciergerie ${id} non trouvée`);
    }

    // If priority changes, recalculate dateLimite
    if (data.priorite && data.priorite !== demande.priorite) {
      data.dateLimite = this.calculateDateLimite(demande.createdAt, data.priorite);
    }

    Object.assign(demande, data);

    // SLA check: if resolution date is set, check if it respects the deadline
    if (demande.dateResolution && demande.dateLimite) {
      demande.slaRespected = demande.dateResolution.getTime() <= demande.dateLimite.getTime();
    }

    const saved = await this.repository.save(demande);
    this.logger.log(`Updated DemandeConciergerie ${saved.id} (statut=${saved.statut})`);
    return saved;
  }

  /**
   * Assign a demande to a user and set status to EN_COURS.
   */
  async assigner(id: string, userId: string): Promise<DemandeConciergerie> {
    const demande = await this.findById(id);
    if (!demande) {
      throw new NotFoundException(`DemandeConciergerie ${id} non trouvée`);
    }

    demande.assigneA = userId;
    if (demande.statut === DemandeStatut.NOUVELLE) {
      demande.statut = DemandeStatut.EN_COURS;
    }

    const saved = await this.repository.save(demande);
    this.logger.log(`Assigned DemandeConciergerie ${saved.id} to ${userId}`);
    return saved;
  }

  /**
   * Close a demande, set resolution date and check SLA.
   */
  async cloturer(id: string, resolutionNotes?: string, satisfactionScore?: number): Promise<DemandeConciergerie> {
    const demande = await this.findById(id);
    if (!demande) {
      throw new NotFoundException(`DemandeConciergerie ${id} non trouvée`);
    }

    const now = new Date();
    demande.statut = DemandeStatut.FERMEE;
    demande.dateResolution = now;

    if (satisfactionScore !== undefined) {
      demande.satisfactionScore = satisfactionScore;
    }

    // SLA check
    if (demande.dateLimite) {
      demande.slaRespected = now.getTime() <= demande.dateLimite.getTime();
    }

    // Store resolution notes in metadata
    if (resolutionNotes) {
      demande.metadata = {
        ...demande.metadata,
        resolutionNotes,
      };
    }

    const saved = await this.repository.save(demande);
    this.logger.log(`Closed DemandeConciergerie ${saved.id} (slaRespected=${saved.slaRespected})`);
    return saved;
  }

  /**
   * Check all open demandes for SLA violations and mark them.
   */
  async checkSlaViolations(): Promise<number> {
    const now = new Date();
    const openStatuts = [DemandeStatut.NOUVELLE, DemandeStatut.EN_COURS, DemandeStatut.EN_ATTENTE];

    const violated = await this.repository.find({
      where: {
        statut: In(openStatuts),
        dateLimite: LessThan(now),
        slaRespected: undefined as any, // not yet evaluated
      },
    });

    let count = 0;
    for (const demande of violated) {
      if (demande.slaRespected !== false) {
        demande.slaRespected = false;
        await this.repository.save(demande);
        count++;
      }
    }

    if (count > 0) {
      this.logger.warn(`Marked ${count} demandes as SLA-violated`);
    }

    return count;
  }

  async save(entity: DemandeConciergerie): Promise<DemandeConciergerie> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    if (!entity) {
      return false;
    }
    await this.repository.remove(entity);
    this.logger.log(`Deleted DemandeConciergerie ${id}`);
    return true;
  }

  /**
   * Calculate SLA deadline based on priority.
   */
  calculateDateLimite(fromDate: Date, priorite: DemandePriorite): Date {
    const delay = SLA_DELAYS[priorite] ?? SLA_DELAYS[DemandePriorite.NORMALE];
    return new Date(fromDate.getTime() + delay);
  }
}
