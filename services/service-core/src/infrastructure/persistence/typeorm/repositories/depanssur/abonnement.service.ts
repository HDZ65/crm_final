import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { NatsService } from '@crm/shared-kernel';
import { randomUUID } from 'crypto';
import { AbonnementDepanssurEntity } from '../../../../../domain/depanssur/entities/abonnement-depanssur.entity';
import { HistoriqueStatutAbonnementEntity } from '../../../../../domain/depanssur/entities/historique-statut-abonnement.entity';
import {
  RegleDepanssurError,
  RegleDepanssurService,
} from '../../../../../domain/depanssur/services/regle-depanssur.service';
import type { IAbonnementRepository } from '../../../../../domain/depanssur/repositories/IAbonnementRepository';

@Injectable()
export class AbonnementService implements IAbonnementRepository {
  private readonly logger = new Logger(AbonnementService.name);

  constructor(
    @InjectRepository(AbonnementDepanssurEntity)
    private readonly repository: Repository<AbonnementDepanssurEntity>,
    @InjectRepository(HistoriqueStatutAbonnementEntity)
    private readonly historiqueRepository: Repository<HistoriqueStatutAbonnementEntity>,
    private readonly regleDepanssurService: RegleDepanssurService,
    private readonly natsService: NatsService,
  ) {}

  async create(input: any): Promise<AbonnementDepanssurEntity> {
    const entity = this.repository.create({
      organisationId: input.organisationId || input.organisation_id,
      clientId: input.clientId || input.client_id,
      planType: input.planType || input.plan_type,
      periodicite: input.periodicite,
      periodeAttente: input.periodeAttente ?? input.periode_attente ?? 0,
      franchise: input.franchise != null ? String(input.franchise) : null,
      plafondParIntervention: input.plafondParIntervention ?? input.plafond_par_intervention != null
        ? String(input.plafondParIntervention ?? input.plafond_par_intervention)
        : null,
      plafondAnnuel: input.plafondAnnuel ?? input.plafond_annuel != null
        ? String(input.plafondAnnuel ?? input.plafond_annuel)
        : null,
      nbInterventionsMax: input.nbInterventionsMax ?? input.nb_interventions_max ?? null,
      statut: 'ACTIF',
      dateSouscription: new Date(input.dateSouscription || input.date_souscription),
      dateEffet: new Date(input.dateEffet || input.date_effet),
      dateFin: input.dateFin || input.date_fin ? new Date(input.dateFin || input.date_fin) : null,
      prochaineEcheance: new Date(input.prochaineEcheance || input.prochaine_echeance),
      prixTtc: String(input.prixTtc ?? input.prix_ttc),
      tauxTva: String(input.tauxTva ?? input.taux_tva),
      montantHt: String(input.montantHt ?? input.montant_ht),
      codeRemise: input.codeRemise ?? input.code_remise ?? null,
      montantRemise: input.montantRemise ?? input.montant_remise != null
        ? String(input.montantRemise ?? input.montant_remise)
        : null,
    });

    const saved = await this.repository.save(entity);

    // Publish AbonnementCreatedEvent
    await this.publishAbonnementCreatedEvent(saved);

    return saved;
  }

  async update(input: any): Promise<AbonnementDepanssurEntity> {
    const entity = await this.findById(input.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Abonnement ${input.id} not found` });
    }

    const oldStatut = entity.statut;
    const oldPlanType = entity.planType;

    const requestedPlanType = input.planType ?? input.plan_type;
    if (requestedPlanType !== undefined && requestedPlanType !== null && requestedPlanType !== entity.planType) {
      const nouveauPlan = String(requestedPlanType);
      const downgrade = this.isDowngrade(entity.planType, nouveauPlan);

      try {
        if (downgrade) {
          const result = this.regleDepanssurService.downgraderPlan(entity, nouveauPlan);
          if (result.estImmediat) {
            entity.planType = nouveauPlan;
          } else {
            this.logger.log(
              `Downgrade abonnement ${entity.id} programme au ${result.dateEffet.toISOString()} (N+1), plan courant conserve`,
            );
          }
        } else {
          const result = this.regleDepanssurService.upgraderPlan(entity, nouveauPlan);
          entity.planType = result.planTypeEffectif;
        }
      } catch (error) {
        if (error instanceof RegleDepanssurError) {
          throw new RpcException({ code: status.FAILED_PRECONDITION, message: error.message });
        }
        throw error;
      }
    }

    if (input.periodicite !== undefined) entity.periodicite = input.periodicite;
    if (input.periodeAttente ?? input.periode_attente !== undefined) entity.periodeAttente = input.periodeAttente ?? input.periode_attente;
    if (input.franchise !== undefined) entity.franchise = input.franchise != null ? String(input.franchise) : null;
    if (input.plafondParIntervention ?? input.plafond_par_intervention !== undefined) {
      entity.plafondParIntervention = (input.plafondParIntervention ?? input.plafond_par_intervention) != null
        ? String(input.plafondParIntervention ?? input.plafond_par_intervention) : null;
    }
    if (input.plafondAnnuel ?? input.plafond_annuel !== undefined) {
      entity.plafondAnnuel = (input.plafondAnnuel ?? input.plafond_annuel) != null
        ? String(input.plafondAnnuel ?? input.plafond_annuel) : null;
    }
    if (input.nbInterventionsMax ?? input.nb_interventions_max !== undefined) {
      entity.nbInterventionsMax = input.nbInterventionsMax ?? input.nb_interventions_max ?? null;
    }
    if (input.statut !== undefined) entity.statut = input.statut;
    if (input.motifResiliation ?? input.motif_resiliation !== undefined) {
      entity.motifResiliation = input.motifResiliation ?? input.motif_resiliation ?? null;
    }
    if (input.dateFin ?? input.date_fin !== undefined) {
      entity.dateFin = (input.dateFin ?? input.date_fin) ? new Date(input.dateFin ?? input.date_fin) : null;
    }
    if (input.prochaineEcheance ?? input.prochaine_echeance) {
      entity.prochaineEcheance = new Date(input.prochaineEcheance ?? input.prochaine_echeance);
    }
    if (input.prixTtc ?? input.prix_ttc !== undefined) entity.prixTtc = String(input.prixTtc ?? input.prix_ttc);
    if (input.tauxTva ?? input.taux_tva !== undefined) entity.tauxTva = String(input.tauxTva ?? input.taux_tva);
    if (input.montantHt ?? input.montant_ht !== undefined) entity.montantHt = String(input.montantHt ?? input.montant_ht);
    if (input.codeRemise ?? input.code_remise !== undefined) entity.codeRemise = input.codeRemise ?? input.code_remise ?? null;
    if (input.montantRemise ?? input.montant_remise !== undefined) {
      entity.montantRemise = (input.montantRemise ?? input.montant_remise) != null
        ? String(input.montantRemise ?? input.montant_remise) : null;
    }

    const saved = await this.repository.save(entity);

    // Track status change in history
    if (entity.statut !== oldStatut) {
      const historique = this.historiqueRepository.create({
        abonnementId: entity.id,
        ancienStatut: oldStatut,
        nouveauStatut: entity.statut,
        motif: input.motifResiliation ?? input.motif_resiliation ?? null,
      });
      await this.historiqueRepository.save(historique);

      // Publish AbonnementStatusChangedEvent
      await this.publishAbonnementStatusChangedEvent(saved, oldStatut, entity.statut, input.motifResiliation ?? input.motif_resiliation);
    }

    // Check for plan upgrade/downgrade
    if (entity.planType !== oldPlanType) {
      const downgrade = this.isDowngrade(oldPlanType, entity.planType);
      
      if (downgrade) {
        await this.publishAbonnementDowngradedEvent(saved, oldPlanType, entity.planType);
      } else {
        await this.publishAbonnementUpgradedEvent(saved, oldPlanType, entity.planType);
      }
    }

    return saved;
  }

  async findById(id: string): Promise<AbonnementDepanssurEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['options', 'compteurs'],
    });
  }

  async findByClientId(organisationId: string, clientId: string): Promise<AbonnementDepanssurEntity | null> {
    return this.repository.findOne({
      where: { organisationId, clientId },
      relations: ['options', 'compteurs'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(
    organisationId: string,
    filters?: { clientId?: string; statut?: string; planType?: string; search?: string },
    pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string },
  ): Promise<{
    abonnements: AbonnementDepanssurEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const qb = this.repository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.options', 'options')
      .leftJoinAndSelect('a.compteurs', 'compteurs')
      .where('a.organisationId = :orgId', { orgId: organisationId });

    if (filters?.clientId) {
      qb.andWhere('a.clientId = :clientId', { clientId: filters.clientId });
    }
    if (filters?.statut) {
      qb.andWhere('a.statut = :statut', { statut: filters.statut });
    }
    if (filters?.planType) {
      qb.andWhere('a.planType = :planType', { planType: filters.planType });
    }
    if (filters?.search) {
      qb.andWhere('(a.planType ILIKE :search OR a.codeRemise ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [abonnements, total] = await qb
      .orderBy(`a.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { abonnements, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Abonnement ${id} not found` });
    }
  }

  async save(entity: AbonnementDepanssurEntity): Promise<AbonnementDepanssurEntity> {
    return this.repository.save(entity);
  }

  private isDowngrade(planActuel: string, nouveauPlan: string): boolean {
    const ordrePlan: Record<string, number> = {
      ESSENTIEL: 1,
      STANDARD: 2,
      PREMIUM: 3,
    };

    const rangActuel = ordrePlan[(planActuel || '').toUpperCase()];
    const rangNouveau = ordrePlan[(nouveauPlan || '').toUpperCase()];

    if (!rangActuel || !rangNouveau) {
      return false;
    }

    return rangNouveau < rangActuel;
  }

  private async publishAbonnementCreatedEvent(abonnement: AbonnementDepanssurEntity): Promise<void> {
    try {
      const event = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: null,
        abonnement_id: abonnement.id,
        client_id: abonnement.clientId,
        organisation_id: abonnement.organisationId,
        formule: abonnement.planType,
        statut: abonnement.statut,
        date_debut: abonnement.dateEffet,
        created_at: abonnement.createdAt,
      };
      await this.natsService.publish('depanssur.abonnement.created', event);
      this.logger.debug(`Published depanssur.abonnement.created for ${abonnement.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish depanssur.abonnement.created: ${error}`);
    }
  }

  private async publishAbonnementStatusChangedEvent(
    abonnement: AbonnementDepanssurEntity,
    ancienStatut: string,
    nouveauStatut: string,
    motif?: string,
  ): Promise<void> {
    try {
      const event = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: null,
        abonnement_id: abonnement.id,
        client_id: abonnement.clientId,
        organisation_id: abonnement.organisationId,
        ancien_statut: ancienStatut,
        nouveau_statut: nouveauStatut,
        motif: motif || null,
        changed_at: new Date(),
      };
      await this.natsService.publish('depanssur.abonnement.status_changed', event);
      this.logger.debug(`Published depanssur.abonnement.status_changed for ${abonnement.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish depanssur.abonnement.status_changed: ${error}`);
    }
  }

  private async publishAbonnementUpgradedEvent(
    abonnement: AbonnementDepanssurEntity,
    ancienneFormule: string,
    nouvelleFormule: string,
  ): Promise<void> {
    try {
      const event = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: null,
        abonnement_id: abonnement.id,
        client_id: abonnement.clientId,
        organisation_id: abonnement.organisationId,
        ancienne_formule: ancienneFormule,
        nouvelle_formule: nouvelleFormule,
        upgraded_at: new Date(),
      };
      await this.natsService.publish('depanssur.abonnement.upgraded', event);
      this.logger.debug(`Published depanssur.abonnement.upgraded for ${abonnement.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish depanssur.abonnement.upgraded: ${error}`);
    }
  }

  private async publishAbonnementDowngradedEvent(
    abonnement: AbonnementDepanssurEntity,
    ancienneFormule: string,
    nouvelleFormule: string,
  ): Promise<void> {
    try {
      const event = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: null,
        abonnement_id: abonnement.id,
        client_id: abonnement.clientId,
        organisation_id: abonnement.organisationId,
        ancienne_formule: ancienneFormule,
        nouvelle_formule: nouvelleFormule,
        downgraded_at: new Date(),
      };
      await this.natsService.publish('depanssur.abonnement.downgraded', event);
      this.logger.debug(`Published depanssur.abonnement.downgraded for ${abonnement.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish depanssur.abonnement.downgraded: ${error}`);
    }
  }
}
