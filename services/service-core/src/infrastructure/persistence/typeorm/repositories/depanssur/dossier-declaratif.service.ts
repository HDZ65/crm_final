import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { DossierDeclaratifEntity } from '../../../../../domain/depanssur/entities/dossier-declaratif.entity';
import { HistoriqueStatutDossierEntity } from '../../../../../domain/depanssur/entities/historique-statut-dossier.entity';
import type { IDossierDeclaratifRepository } from '../../../../../domain/depanssur/repositories/IDossierDeclaratifRepository';

@Injectable()
export class DossierDeclaratifService implements IDossierDeclaratifRepository {
  private readonly logger = new Logger(DossierDeclaratifService.name);

  constructor(
    @InjectRepository(DossierDeclaratifEntity)
    private readonly repository: Repository<DossierDeclaratifEntity>,
    @InjectRepository(HistoriqueStatutDossierEntity)
    private readonly historiqueRepository: Repository<HistoriqueStatutDossierEntity>,
  ) {}

  async create(input: any): Promise<DossierDeclaratifEntity> {
    // Check idempotency via referenceExterne
    const referenceExterne = input.referenceExterne || input.reference_externe;
    const organisationId = input.organisationId || input.organisation_id;

    if (referenceExterne) {
      const existing = await this.findByReferenceExterne(organisationId, referenceExterne);
      if (existing) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Dossier with referenceExterne ${referenceExterne} already exists`,
        });
      }
    }

    const entity = this.repository.create({
      organisationId,
      abonnementId: input.abonnementId || input.abonnement_id,
      clientId: input.clientId || input.client_id,
      referenceExterne,
      dateOuverture: new Date(input.dateOuverture || input.date_ouverture),
      type: input.type,
      statut: 'ENREGISTRE',
      adresseRisqueId: input.adresseRisqueId || input.adresse_risque_id || null,
      montantEstimatif: input.montantEstimatif ?? input.montant_estimatif ?? null,
    });

    return this.repository.save(entity);
  }

  async update(input: any): Promise<DossierDeclaratifEntity> {
    const entity = await this.findById(input.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Dossier ${input.id} not found` });
    }

    const oldStatut = entity.statut;
    const newStatut = input.statut !== undefined ? this.resolveStatut(input.statut) : undefined;

    // Update fields
    if (newStatut !== undefined) entity.statut = newStatut;
    if (input.montantEstimatif ?? input.montant_estimatif !== undefined) {
      entity.montantEstimatif = input.montantEstimatif ?? input.montant_estimatif ?? null;
    }
    if (input.priseEnCharge ?? input.prise_en_charge !== undefined) {
      entity.priseEnCharge = input.priseEnCharge ?? input.prise_en_charge ?? null;
    }
    if (input.franchiseAppliquee ?? input.franchise_appliquee !== undefined) {
      entity.franchiseAppliquee = input.franchiseAppliquee ?? input.franchise_appliquee ?? null;
    }
    if (input.resteACharge ?? input.reste_a_charge !== undefined) {
      entity.resteACharge = input.resteACharge ?? input.reste_a_charge ?? null;
    }
    if (input.montantPrisEnCharge ?? input.montant_pris_en_charge !== undefined) {
      entity.montantPrisEnCharge = input.montantPrisEnCharge ?? input.montant_pris_en_charge ?? null;
    }
    if (input.npsScore ?? input.nps_score !== undefined) {
      entity.npsScore = input.npsScore ?? input.nps_score ?? null;
    }
    if (input.npsCommentaire ?? input.nps_commentaire !== undefined) {
      entity.npsCommentaire = input.npsCommentaire ?? input.nps_commentaire ?? null;
    }
    if (input.dateCloture ?? input.date_cloture !== undefined) {
      entity.dateCloture = (input.dateCloture ?? input.date_cloture)
        ? new Date(input.dateCloture ?? input.date_cloture)
        : null;
    }
    if (input.adresseRisqueId ?? input.adresse_risque_id !== undefined) {
      entity.adresseRisqueId = input.adresseRisqueId ?? input.adresse_risque_id ?? null;
    }

    const saved = await this.repository.save(entity);

    // Track status change in history
    if (newStatut !== undefined && newStatut !== oldStatut) {
      const historique = this.historiqueRepository.create({
        dossierId: entity.id,
        ancienStatut: oldStatut,
        nouveauStatut: newStatut,
        motif: input.motif ?? null,
      });
      await this.historiqueRepository.save(historique);
      this.logger.log(`Dossier ${entity.id}: status changed ${oldStatut} → ${newStatut}`);
    }

    return saved;
  }

  async findById(id: string): Promise<DossierDeclaratifEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByReferenceExterne(organisationId: string, referenceExterne: string): Promise<DossierDeclaratifEntity | null> {
    return this.repository.findOne({
      where: { organisationId, referenceExterne },
    });
  }

  async findAll(
    organisationId: string,
    filters?: {
      abonnementId?: string;
      clientId?: string;
      type?: string;
      statut?: string;
      search?: string;
    },
    pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string },
  ): Promise<{
    dossiers: DossierDeclaratifEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const qb = this.repository
      .createQueryBuilder('d')
      .where('d.organisationId = :orgId', { orgId: organisationId });

    if (filters?.abonnementId) {
      qb.andWhere('d.abonnementId = :abonnementId', { abonnementId: filters.abonnementId });
    }
    if (filters?.clientId) {
      qb.andWhere('d.clientId = :clientId', { clientId: filters.clientId });
    }
    if (filters?.type) {
      qb.andWhere('d.type = :type', { type: filters.type });
    }
    if (filters?.statut) {
      qb.andWhere('d.statut = :statut', { statut: filters.statut });
    }
    if (filters?.search) {
      qb.andWhere(
        '(d.referenceExterne ILIKE :search OR d.npsCommentaire ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [dossiers, total] = await qb
      .orderBy(`d.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { dossiers, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Dossier ${id} not found` });
    }
  }

  async save(entity: DossierDeclaratifEntity): Promise<DossierDeclaratifEntity> {
    return this.repository.save(entity);
  }

  /**
   * Resolve proto enum value to string statut.
   * Proto StatutDossier enum: 0=UNSPECIFIED, 1=ENREGISTRE, 2=EN_ANALYSE, 3=ACCEPTE, 4=REFUSE, 5=CLOTURE
   */
  private resolveStatut(value: any): string {
    const map: Record<number, string> = {
      1: 'ENREGISTRE',
      2: 'EN_ANALYSE',
      3: 'ACCEPTE',
      4: 'REFUSE',
      5: 'CLOTURE',
    };
    if (typeof value === 'number' && map[value]) {
      return map[value];
    }
    if (typeof value === 'string' && ['ENREGISTRE', 'EN_ANALYSE', 'ACCEPTE', 'REFUSE', 'CLOTURE'].includes(value)) {
      return value;
    }
    return value;
  }
}
