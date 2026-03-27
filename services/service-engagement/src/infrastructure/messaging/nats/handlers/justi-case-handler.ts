import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CasJuridique,
  CasJuridiqueStatut,
  CasJuridiqueType,
} from '../../../../domain/services/entities/cas-juridique.entity';

/**
 * Handler for Justi+ case events via NATS
 * Subjects: justi.case.opened, justi.case.updated, justi.case.closed
 *
 * Processes legal case lifecycle events from the Justi+ partner platform
 * and synchronizes them with the local CasJuridique entity.
 *
 * NOTE: NATS subscription will be wired when @crm/nats-utils is added.
 * Currently exposes handler methods for direct invocation or gRPC relay.
 */

export interface JustiCaseEvent {
  externalId: string;
  clientId: string;
  contratId: string;
  organisationId: string;
  titre: string;
  description: string;
  type: string;
  statut: string;
  domaineJuridique: string;
  avocatAssigne: string;
  dateOuverture: string;
  dateCloture?: string;
  montantCouvert: number;
  montantFranchise: number;
  notes?: string;
  metadata?: Record<string, any>;
  eventType: 'opened' | 'updated' | 'closed';
  timestamp: string;
}

@Injectable()
export class JustiCaseHandler implements OnModuleInit {
  private readonly logger = new Logger(JustiCaseHandler.name);

  constructor(
    @InjectRepository(CasJuridique)
    private readonly casJuridiqueRepository: Repository<CasJuridique>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('JustiCaseHandler initialized - ready to process case events');
    // TODO: Wire NATS subscriptions when nats-utils is available
    // await this.natsService.subscribeProto('justi.case.*', this.handleEvent.bind(this));
  }

  async handleCaseOpened(data: JustiCaseEvent): Promise<CasJuridique> {
    this.logger.log(`Processing justi.case.opened: ${data.externalId}`);

    try {
      // Check for duplicate by reference
      const existing = await this.casJuridiqueRepository.findOne({
        where: { reference: data.externalId },
      });

      if (existing) {
        this.logger.warn(`Case already exists: ${data.externalId}, skipping creation`);
        return existing;
      }

      const casJuridique = this.casJuridiqueRepository.create({
        organisationId: data.organisationId,
        clientId: data.clientId,
        reference: data.externalId,
        titre: data.titre,
        description: data.description,
        type: this.mapType(data.type),
        statut: this.mapStatut(data.statut),
        avocatId: data.avocatAssigne,
        montantEnjeu: data.montantCouvert,
        montantProvision: data.montantFranchise,
        dateOuverture: data.dateOuverture ? new Date(data.dateOuverture) : new Date(),
        metadata: {
          ...data.metadata,
          domaineJuridique: data.domaineJuridique,
          source: 'justi-plus',
          notes: data.notes,
        },
      });

      const saved = await this.casJuridiqueRepository.save(casJuridique);
      this.logger.debug(`CasJuridique created: ${saved.id} (ref=${data.externalId})`);
      return saved;
    } catch (error: any) {
      this.logger.error(`Failed to process justi.case.opened: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleCaseUpdated(data: JustiCaseEvent): Promise<void> {
    this.logger.log(`Processing justi.case.updated: ${data.externalId}`);

    try {
      const existing = await this.casJuridiqueRepository.findOne({
        where: { reference: data.externalId },
      });

      if (!existing) {
        this.logger.warn(`Case ${data.externalId} not found locally, creating from update event`);
        await this.handleCaseOpened({ ...data, eventType: 'opened' });
        return;
      }

      existing.titre = data.titre;
      existing.description = data.description;
      existing.type = this.mapType(data.type);
      existing.statut = this.mapStatut(data.statut);
      existing.avocatId = data.avocatAssigne;
      existing.montantEnjeu = data.montantCouvert;
      existing.montantProvision = data.montantFranchise;
      existing.metadata = {
        ...existing.metadata,
        ...data.metadata,
        domaineJuridique: data.domaineJuridique,
        source: 'justi-plus',
        notes: data.notes,
        lastSyncedAt: new Date().toISOString(),
      };

      await this.casJuridiqueRepository.save(existing);
      this.logger.debug(`CasJuridique updated: ${existing.id} (ref=${data.externalId})`);
    } catch (error: any) {
      this.logger.error(`Failed to process justi.case.updated: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleCaseClosed(data: JustiCaseEvent): Promise<void> {
    this.logger.log(`Processing justi.case.closed: ${data.externalId}`);

    try {
      const existing = await this.casJuridiqueRepository.findOne({
        where: { reference: data.externalId },
      });

      if (!existing) {
        this.logger.warn(`Case ${data.externalId} not found locally for close event`);
        return;
      }

      existing.statut = this.mapStatut(data.statut) || CasJuridiqueStatut.CLOS_GAGNE;
      existing.dateCloture = data.dateCloture ? new Date(data.dateCloture) : new Date();
      existing.metadata = {
        ...existing.metadata,
        closedByPartner: true,
        closedAt: new Date().toISOString(),
        source: 'justi-plus',
      };

      await this.casJuridiqueRepository.save(existing);
      this.logger.debug(`CasJuridique closed: ${existing.id} (ref=${data.externalId})`);
    } catch (error: any) {
      this.logger.error(`Failed to process justi.case.closed: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  // ========== Mapping Helpers ==========

  private mapType(justiType: string): CasJuridiqueType {
    const mapping: Record<string, CasJuridiqueType> = {
      consultation: CasJuridiqueType.CONSEIL,
      litige: CasJuridiqueType.LITIGE,
      mediation: CasJuridiqueType.MEDIATION,
      contentieux: CasJuridiqueType.CONTENTIEUX,
      conseil: CasJuridiqueType.CONSEIL,
    };
    return mapping[justiType.toLowerCase()] || CasJuridiqueType.AUTRE;
  }

  private mapStatut(justiStatut: string): CasJuridiqueStatut {
    const mapping: Record<string, CasJuridiqueStatut> = {
      ouvert: CasJuridiqueStatut.OUVERT,
      en_cours: CasJuridiqueStatut.EN_COURS,
      en_attente: CasJuridiqueStatut.EN_ATTENTE,
      resolu: CasJuridiqueStatut.CLOS_GAGNE,
      clos: CasJuridiqueStatut.CLOS_ACCORD,
      refuse: CasJuridiqueStatut.ANNULE,
    };
    return mapping[justiStatut.toLowerCase()] || CasJuridiqueStatut.OUVERT;
  }
}
