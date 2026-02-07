import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ScheduleEntity,
  ScheduleStatus,
} from '../../../../../domain/payments/entities/schedule.entity';
import {
  BundlePriceRecalculatedServiceInput,
  ConsolidatedBillingService,
} from '../factures/consolidated-billing.service';

export interface HandleServiceNonPaymentInput {
  organisationId: string;
  clientBaseId: string;
  serviceCode: string;
  societeId?: string;
  factureId?: string;
  contratId?: string;
  servicesWithoutDiscount?: BundlePriceRecalculatedServiceInput[];
  reason?: string;
}

export interface HandleServiceNonPaymentResult {
  action: 'DISCOUNTS_RECALCULATED' | 'SERVICE_SUSPENDED' | 'NO_ACTION';
  updatedLines: number;
  suspendedScheduleIds: string[];
}

@Injectable()
export class SelectiveDunningService {
  private readonly logger = new Logger(SelectiveDunningService.name);

  constructor(
    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
    private readonly consolidatedBillingService: ConsolidatedBillingService,
  ) {}

  async handleServiceNonPayment(
    input: HandleServiceNonPaymentInput,
  ): Promise<HandleServiceNonPaymentResult> {
    const serviceCode = this.normalizeServiceCode(input.serviceCode);
    if (!serviceCode) {
      return {
        action: 'NO_ACTION',
        updatedLines: 0,
        suspendedScheduleIds: [],
      };
    }

    if (serviceCode === 'CONCIERGERIE') {
      const discountReset = await this.consolidatedBillingService.removeBundleDiscountsForClient({
        organisationId: input.organisationId,
        clientBaseId: input.clientBaseId,
        factureId: input.factureId,
        contratId: input.contratId,
        services: input.servicesWithoutDiscount,
      });

      this.logger.warn(
        `Selective dunning applied for CONCIERGERIE non-payment: facture=${discountReset.factureId ?? 'n/a'}, lines=${discountReset.updatedLines}`,
      );

      return {
        action:
          discountReset.updatedLines > 0 ? 'DISCOUNTS_RECALCULATED' : 'NO_ACTION',
        updatedLines: discountReset.updatedLines,
        suspendedScheduleIds: [],
      };
    }

    const whereClause: Record<string, unknown> = {
      organisationId: input.organisationId,
      clientId: input.clientBaseId,
      status: ScheduleStatus.ACTIVE,
    };

    if (input.societeId) {
      whereClause.societeId = input.societeId;
    }

    if (input.contratId) {
      whereClause.contratId = input.contratId;
    }

    const activeSchedules = await this.scheduleRepository.find({
      where: whereClause,
      order: {
        createdAt: 'DESC',
      },
    });

    const suspendedAt = new Date().toISOString();
    const affectedSchedules = activeSchedules.filter(
      (schedule) => this.extractServiceCode(schedule) === serviceCode,
    );

    if (affectedSchedules.length === 0) {
      return {
        action: 'NO_ACTION',
        updatedLines: 0,
        suspendedScheduleIds: [],
      };
    }

    for (const schedule of affectedSchedules) {
      schedule.status = ScheduleStatus.PAUSED;
      schedule.metadata = {
        ...(schedule.metadata ?? {}),
        dunningSuspended: true,
        dunningSuspendedServiceCode: serviceCode,
        dunningSuspendedAt: suspendedAt,
        dunningReason: input.reason ?? 'SERVICE_NON_PAYMENT',
      };
    }

    await this.scheduleRepository.save(affectedSchedules);

    this.logger.warn(
      `Selective dunning suspended ${affectedSchedules.length} schedule(s) for service ${serviceCode} and client ${input.clientBaseId}`,
    );

    return {
      action: 'SERVICE_SUSPENDED',
      updatedLines: 0,
      suspendedScheduleIds: affectedSchedules.map((schedule) => schedule.id),
    };
  }

  private extractServiceCode(schedule: ScheduleEntity): string | null {
    const metadata = schedule.metadata ?? {};
    const candidate =
      metadata.serviceCode ??
      metadata.service_code ??
      metadata.bundleServiceCode ??
      metadata.bundle_service_code ??
      metadata.productCode ??
      metadata.product_code;

    return this.normalizeServiceCode(
      candidate === undefined || candidate === null ? null : String(candidate),
    );
  }

  private normalizeServiceCode(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    return normalized.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  }
}
