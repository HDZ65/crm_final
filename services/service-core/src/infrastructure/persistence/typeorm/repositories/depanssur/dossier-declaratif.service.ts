import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { NatsService } from '@crm/shared-kernel';
import { randomUUID } from 'crypto';
import { DossierDeclaratifEntity } from '../../../../../domain/depanssur/entities/dossier-declaratif.entity';
import { HistoriqueStatutDossierEntity } from '../../../../../domain/depanssur/entities/historique-statut-dossier.entity';
import {
  RegleDepanssurError,
  RegleDepanssurService,
} from '../../../../../domain/depanssur/services/regle-depanssur.service';
import type { IDossierDeclaratifRepository } from '../../../../../domain/depanssur/repositories/IDossierDeclaratifRepository';
import { AbonnementService } from './abonnement.service';

@Injectable()
export class DossierDeclaratifService implements IDossierDeclaratifRepository {
  private readonly logger = new Logger(DossierDeclaratifService.name);

  constructor(
    @InjectRepository(DossierDeclaratifEntity)
    private readonly repository: Repository<DossierDeclaratifEntity>,
    private readonly abonnementService: AbonnementService,
    private readonly regleDepanssurService: RegleDepanssurService,
    private readonly natsService: NatsService,
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

    const     entity = this.repository.create({
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

    const saved = await this.repository.save(entity);

    // Publish DossierCreatedEvent
    await this.publishDossierCreatedEvent(saved);

    return saved;
  }

  async update(input: any): Promise<DossierDeclaratifEntity> {
    const existing = await this.findById(input.id);
    if (!existing) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Dossier ${input.id} not found` });
    }

    const requestedStatut = input.statut !== undefined ? this.resolveStatut(input.statut) : undefined;

    return this.repository.manager.transaction(async (manager) => {
      const dossierRepository = manager.getRepository(DossierDeclaratifEntity);
      const historiqueRepository = manager.getRepository(HistoriqueStatutDossierEntity);
      const entity = await dossierRepository.findOne({ where: { id: input.id } });

      if (!entity) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Dossier ${input.id} not found` });
      }

      const oldStatut = entity.statut;
      const newStatut = requestedStatut;

      if (newStatut === 'ACCEPTE' && oldStatut !== 'ACCEPTE') {
        await this.validerAcceptationDossier(entity, input, manager);
      }

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

      const saved = await dossierRepository.save(entity);

      if (newStatut !== undefined && newStatut !== oldStatut) {
        const historique = historiqueRepository.create({
          dossierId: entity.id,
          ancienStatut: oldStatut,
          nouveauStatut: newStatut,
          motif: input.motif ?? null,
        });
        await historiqueRepository.save(historique);
        this.logger.log(`Dossier ${entity.id}: status changed ${oldStatut} -> ${newStatut}`);

        // Publish DossierStatusChangedEvent
        await this.publishDossierStatusChangedEvent(saved, oldStatut, newStatut);

        // Publish DossierDecisionEvent if status is ACCEPTE or REFUSE
        if (newStatut === 'ACCEPTE' || newStatut === 'REFUSE') {
          await this.publishDossierDecisionEvent(saved, newStatut, input);
        }

        // Publish DossierClosedEvent if status is CLOTURE
        if (newStatut === 'CLOTURE') {
          await this.publishDossierClosedEvent(saved, input.motif);
        }
      }

      return saved;
    });
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

  private async validerAcceptationDossier(
    entity: DossierDeclaratifEntity,
    input: any,
    manager: EntityManager,
  ): Promise<void> {
    const abonnement = await this.abonnementService.findById(entity.abonnementId);
    if (!abonnement) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Abonnement ${entity.abonnementId} not found for dossier ${entity.id}`,
      });
    }

    try {
      const carence = this.regleDepanssurService.validerCarence(abonnement, entity.dateOuverture);
      if (!carence.valide) {
        throw new RegleDepanssurError(
          carence.raison ?? 'CARENCE_EN_COURS',
          `Periode de carence active jusqu'au ${carence.dateFinCarence.toISOString()}`,
        );
      }

      const montantIntervention = this.resolveMontantIntervention(input, entity);
      const compteur = await this.regleDepanssurService.resetCompteurAnnuel(
        abonnement,
        entity.dateOuverture,
        manager,
      );
      const plafonds = this.regleDepanssurService.verifierPlafonds(abonnement, montantIntervention, compteur);

      if (!plafonds.autorise) {
        throw new RegleDepanssurError(
          plafonds.raison ?? 'PLAFOND_DEPASSE',
          'Plafond de prise en charge depasse pour cet abonnement',
        );
      }

      await this.regleDepanssurService.majCompteurs(
        abonnement,
        montantIntervention,
        entity.dateOuverture,
        manager,
      );
    } catch (error) {
      if (error instanceof RegleDepanssurError) {
        throw new RpcException({ code: status.FAILED_PRECONDITION, message: error.message });
      }
      throw error;
    }
  }

  private resolveMontantIntervention(input: any, entity: DossierDeclaratifEntity): number {
    const montantPrisEnChargeInput = input.montantPrisEnCharge ?? input.montant_pris_en_charge;
    if (montantPrisEnChargeInput !== undefined && montantPrisEnChargeInput !== null) {
      return Number(montantPrisEnChargeInput);
    }

    const montantEstimatifInput = input.montantEstimatif ?? input.montant_estimatif;
    if (montantEstimatifInput !== undefined && montantEstimatifInput !== null) {
      return Number(montantEstimatifInput);
    }

    if (entity.montantPrisEnCharge !== undefined && entity.montantPrisEnCharge !== null) {
      return Number(entity.montantPrisEnCharge);
    }

    return Number(entity.montantEstimatif ?? 0);
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

  private async publishDossierCreatedEvent(dossier: DossierDeclaratifEntity): Promise<void> {
    try {
      const event = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: null,
        dossier_id: dossier.id,
        abonnement_id: dossier.abonnementId,
        client_id: dossier.clientId,
        organisation_id: dossier.organisationId,
        type_sinistre: dossier.type,
        montant_declare: dossier.montantEstimatif || 0,
        date_sinistre: dossier.dateOuverture,
        created_at: dossier.createdAt,
      };
      await this.natsService.publish('depanssur.dossier.created', event);
      this.logger.debug(`Published depanssur.dossier.created for ${dossier.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish depanssur.dossier.created: ${error}`);
    }
  }

  private async publishDossierStatusChangedEvent(
    dossier: DossierDeclaratifEntity,
    ancienStatut: string,
    nouveauStatut: string,
  ): Promise<void> {
    try {
      const event = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: null,
        dossier_id: dossier.id,
        abonnement_id: dossier.abonnementId,
        client_id: dossier.clientId,
        organisation_id: dossier.organisationId,
        ancien_statut: ancienStatut,
        nouveau_statut: nouveauStatut,
        changed_at: new Date(),
      };
      await this.natsService.publish('depanssur.dossier.status_changed', event);
      this.logger.debug(`Published depanssur.dossier.status_changed for ${dossier.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish depanssur.dossier.status_changed: ${error}`);
    }
  }

  private async publishDossierDecisionEvent(
    dossier: DossierDeclaratifEntity,
    decision: string,
    input: any,
  ): Promise<void> {
    try {
      const event = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: null,
        dossier_id: dossier.id,
        abonnement_id: dossier.abonnementId,
        client_id: dossier.clientId,
        organisation_id: dossier.organisationId,
        decision,
        montant_accorde: dossier.montantPrisEnCharge || 0,
        motif_refus: input.motif || null,
        decided_at: new Date(),
      };
      await this.natsService.publish('depanssur.dossier.decision', event);
      this.logger.debug(`Published depanssur.dossier.decision for ${dossier.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish depanssur.dossier.decision: ${error}`);
    }
  }

  private async publishDossierClosedEvent(dossier: DossierDeclaratifEntity, motif?: string): Promise<void> {
    try {
      const event = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: null,
        dossier_id: dossier.id,
        abonnement_id: dossier.abonnementId,
        client_id: dossier.clientId,
        organisation_id: dossier.organisationId,
        motif_cloture: motif || 'CLOTURE',
        closed_at: dossier.dateCloture || new Date(),
      };
      await this.natsService.publish('depanssur.dossier.closed', event);
      this.logger.debug(`Published depanssur.dossier.closed for ${dossier.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish depanssur.dossier.closed: ${error}`);
    }
  }
}
