import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  ScheduleEntity,
  ScheduleStatus,
  ScheduleFrequency,
  PaymentProvider,
  PaymentIntentEntity,
  PaymentIntentStatus,
  PaymentEventEntity,
  PaymentEventType,
} from '../../../../../domain/payments/entities';
import { FactureEntity } from '../../../../../domain/factures/entities';
import {
  ConsolidatedBillingLineInput,
  ConsolidatedBillingService,
} from '../factures/consolidated-billing.service';

export interface GenerateRecurringBillingInput {
  organisationId: string;
  clientBaseId: string;
  clientPartenaireId: string;
  adresseFacturationId: string;
  statutId: string;
  emissionFactureId: string;
  contratId?: string;
  dateEmission?: Date;
}

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentRepository: Repository<PaymentIntentEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepository: Repository<PaymentEventEntity>,
    private readonly consolidatedBillingService: ConsolidatedBillingService,
  ) {}

  async createSchedule(params: {
    organisationId?: string;
    clientId: string;
    societeId: string;
    contratId?: string;
    factureId?: string;
    provider: PaymentProvider;
    providerAccountId: string;
    providerSubscriptionId?: string;
    providerCustomerId?: string;
    amount: number;
    currency?: string;
    frequency: ScheduleFrequency;
    startDate: Date;
    endDate?: Date;
    metadata?: Record<string, any>;
  }): Promise<ScheduleEntity> {
    const schedule = this.scheduleRepository.create({
      ...params,
      currency: params.currency || 'EUR',
      status: ScheduleStatus.ACTIVE,
      nextPaymentDate: params.startDate,
      plannedDebitDate: params.startDate,
    });

    const savedSchedule = await this.scheduleRepository.save(schedule);

    await this.createEvent({
      scheduleId: savedSchedule.id,
      societeId: params.societeId,
      provider: params.provider,
      eventType: PaymentEventType.SCHEDULE_CREATED,
      payload: { scheduleId: savedSchedule.id },
    });

    return savedSchedule;
  }

  async getScheduleById(id: string): Promise<ScheduleEntity | null> {
    return this.scheduleRepository.findOne({ where: { id } });
  }

  async getSchedulesByClientId(societeId: string, clientId: string): Promise<ScheduleEntity[]> {
    return this.scheduleRepository.find({
      where: { societeId, clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async pauseSchedule(id: string): Promise<ScheduleEntity> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    schedule.status = ScheduleStatus.PAUSED;
    const updated = await this.scheduleRepository.save(schedule);

    await this.createEvent({
      scheduleId: id,
      societeId: schedule.societeId,
      provider: schedule.provider,
      eventType: PaymentEventType.SCHEDULE_PAUSED,
    });

    return updated;
  }

  async resumeSchedule(id: string): Promise<ScheduleEntity> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    schedule.status = ScheduleStatus.ACTIVE;
    const updated = await this.scheduleRepository.save(schedule);

    await this.createEvent({
      scheduleId: id,
      societeId: schedule.societeId,
      provider: schedule.provider,
      eventType: PaymentEventType.SCHEDULE_RESUMED,
    });

    return updated;
  }

  async cancelSchedule(id: string): Promise<ScheduleEntity> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    schedule.status = ScheduleStatus.CANCELLED;
    const updated = await this.scheduleRepository.save(schedule);

    await this.createEvent({
      scheduleId: id,
      societeId: schedule.societeId,
      provider: schedule.provider,
      eventType: PaymentEventType.SCHEDULE_CANCELLED,
    });

    return updated;
  }

  async generateRecurringBillingForClient(
    input: GenerateRecurringBillingInput,
  ): Promise<FactureEntity | null> {
    const whereClause: Record<string, unknown> = {
      organisationId: input.organisationId,
      clientId: input.clientBaseId,
      status: ScheduleStatus.ACTIVE,
    };

    if (input.contratId) {
      whereClause.contratId = input.contratId;
    }

    const schedules = await this.scheduleRepository.find({
      where: whereClause,
      order: {
        createdAt: 'ASC',
      },
    });

    if (schedules.length === 0) {
      this.logger.debug(
        `No active schedules found for recurring billing (org=${input.organisationId}, client=${input.clientBaseId})`,
      );
      return null;
    }

    const services = schedules.map((schedule) =>
      this.toConsolidatedBillingLine(schedule),
    );

    this.logger.log(
      `Generating recurring consolidated facture for client ${input.clientBaseId} with ${services.length} service line(s)`,
    );

    return this.consolidatedBillingService.createRecurringConsolidatedFacture({
      organisationId: input.organisationId,
      dateEmission: input.dateEmission ?? new Date(),
      statutId: input.statutId,
      emissionFactureId: input.emissionFactureId,
      clientBaseId: input.clientBaseId,
      contratId: input.contratId,
      clientPartenaireId: input.clientPartenaireId,
      adresseFacturationId: input.adresseFacturationId,
      services,
    });
  }

  async createEvent(params: {
    paymentIntentId?: string;
    scheduleId?: string;
    societeId: string;
    provider?: PaymentProvider;
    eventType: PaymentEventType;
    providerEventId?: string;
    payload?: Record<string, any>;
    errorMessage?: string;
  }): Promise<PaymentEventEntity> {
    const event = this.paymentEventRepository.create({
      ...params,
      processed: true,
    });

    return this.paymentEventRepository.save(event);
  }

  private toConsolidatedBillingLine(
    schedule: ScheduleEntity,
  ): ConsolidatedBillingLineInput {
    const metadata = schedule.metadata ?? {};

    const serviceCode =
      this.extractMetadataString(metadata, [
        'service_code',
        'serviceCode',
        'bundle_service_code',
        'bundleServiceCode',
        'product_code',
        'productCode',
      ]) ??
      'SERVICE';

    const produitId =
      this.extractMetadataString(metadata, [
        'produit_id',
        'produitId',
        'product_id',
        'productId',
      ]) ??
      schedule.id;

    const prixUnitaire =
      this.extractMetadataNumber(metadata, [
        'bundle_prix_unitaire_ht',
        'bundlePrixUnitaireHt',
        'prix_unitaire_ht',
        'prixUnitaireHt',
      ]) ??
      Number(schedule.amount);

    const prixCatalogueUnitaire =
      this.extractMetadataNumber(metadata, [
        'bundle_prix_catalogue_unitaire_ht',
        'bundlePrixCatalogueUnitaireHt',
        'prix_catalogue_unitaire_ht',
        'prixCatalogueUnitaireHt',
      ]) ??
      Number(schedule.amount);

    const quantite =
      this.extractMetadataNumber(metadata, ['quantite', 'quantity']) ?? 1;

    const tauxTVA =
      this.extractMetadataNumber(metadata, ['taux_tva', 'tauxTVA']) ?? 20;

    const description =
      this.extractMetadataString(metadata, [
        'service_label',
        'serviceLabel',
        'service_name',
        'serviceName',
      ]) ??
      `Service ${serviceCode.replaceAll('_', ' ')}`;

    return {
      serviceCode,
      produitId,
      quantite,
      prixUnitaire,
      prixCatalogueUnitaire,
      tauxTVA,
      description,
    };
  }

  private extractMetadataString(
    metadata: Record<string, any>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = metadata[key];
      if (value !== undefined && value !== null && String(value).trim().length > 0) {
        return String(value).trim();
      }
    }

    return null;
  }

  private extractMetadataNumber(
    metadata: Record<string, any>,
    keys: string[],
  ): number | null {
    for (const key of keys) {
      const value = metadata[key];
      if (value === undefined || value === null || value === '') {
        continue;
      }

      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }
}
