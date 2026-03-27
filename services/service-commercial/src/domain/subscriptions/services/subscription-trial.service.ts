import { Injectable, Logger, Optional } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import {
  StoreSource,
  SubscriptionPlanType,
  SubscriptionStatus,
  type SubscriptionEntity,
} from '../entities/subscription.entity';
import { SubscriptionTriggeredBy } from '../entities/subscription-history.entity';
import {
  SubscriptionChargeService,
  type SubscriptionChargeResult,
} from './subscription-charge.service';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';

const SUBSCRIPTION_TRIAL_CONVERTED_EVENT = 'SUBSCRIPTION_TRIAL_CONVERTED';

const WEB_DIRECT_SOURCES = new Set<StoreSource>([StoreSource.WEB_DIRECT, StoreSource.NONE]);

export interface SubscriptionTrialSchedulingPort {
  getDueForTrialConversion(organisationId: string, now?: Date): Promise<SubscriptionEntity[]>;
}

export interface SubscriptionTrialOptions {
  now?: () => Date;
}

export interface TrialConversionItemResult {
  subscriptionId: string;
  status: 'CONVERTED' | 'PAST_DUE' | 'SKIPPED';
  reason?: string;
  charge?: SubscriptionChargeResult;
}

export interface TrialConversionResult {
  processedCount: number;
  convertedCount: number;
  pastDueCount: number;
  skippedCount: number;
  results: TrialConversionItemResult[];
}

@Injectable()
export class SubscriptionTrialService {
  private readonly logger = new Logger(SubscriptionTrialService.name);

  constructor(
    private readonly schedulingService: SubscriptionTrialSchedulingPort,
    private readonly chargeService: SubscriptionChargeService,
    private readonly lifecycleService: SubscriptionLifecycleService,
    @Optional() private readonly natsService?: NatsService,
    private readonly options: SubscriptionTrialOptions = {},
  ) {}

  async processTrialConversions(organisationId: string): Promise<TrialConversionResult> {
    const now = this.now();
    const dueTrials = await this.schedulingService.getDueForTrialConversion(organisationId, now);
    const results: TrialConversionItemResult[] = [];

    for (const subscription of dueTrials) {
      try {
        const result = await this.processSingleTrialConversion(organisationId, subscription);
        results.push(result);
      } catch (error) {
        results.push({
          subscriptionId: subscription.id,
          status: 'SKIPPED',
          reason: this.errorMessage(error),
        });
      }
    }

    return {
      processedCount: results.filter((result) => result.status !== 'SKIPPED').length,
      convertedCount: results.filter((result) => result.status === 'CONVERTED').length,
      pastDueCount: results.filter((result) => result.status === 'PAST_DUE').length,
      skippedCount: results.filter((result) => result.status === 'SKIPPED').length,
      results,
    };
  }

  private async processSingleTrialConversion(
    organisationId: string,
    subscription: SubscriptionEntity,
  ): Promise<TrialConversionItemResult> {
    if (subscription.organisationId !== organisationId) {
      return {
        subscriptionId: subscription.id,
        status: 'SKIPPED',
        reason: 'ORGANISATION_MISMATCH',
      };
    }

    if (!this.isWebDirectSubscription(subscription)) {
      return {
        subscriptionId: subscription.id,
        status: 'SKIPPED',
        reason: 'STORE_SOURCE_EXCLUDED',
      };
    }

    if (subscription.status !== SubscriptionStatus.TRIAL) {
      return {
        subscriptionId: subscription.id,
        status: 'SKIPPED',
        reason: 'STATUS_NOT_TRIAL',
      };
    }

    if (!this.isTrialExpired(subscription)) {
      return {
        subscriptionId: subscription.id,
        status: 'SKIPPED',
        reason: 'TRIAL_NOT_EXPIRED',
      };
    }

    if (subscription.planType === SubscriptionPlanType.FREE_AVOD) {
      await this.lifecycleService.activateFromTrial(subscription.id, {
        triggeredBy: SubscriptionTriggeredBy.SYSTEM,
      });

      await this.publishEvent(SUBSCRIPTION_TRIAL_CONVERTED_EVENT, {
        subscriptionId: subscription.id,
        organisationId: subscription.organisationId,
        clientId: subscription.clientId,
        conversionType: 'FREE',
        occurredAt: this.now().toISOString(),
      });

      return {
        subscriptionId: subscription.id,
        status: 'CONVERTED',
        reason: 'FREE_PLAN_NO_CHARGE',
      };
    }

    const chargeResult = await this.chargeService.chargeTrialConversion(subscription);

    if (chargeResult.status === 'CHARGED') {
      await this.lifecycleService.activateFromTrial(subscription.id, {
        triggeredBy: SubscriptionTriggeredBy.SYSTEM,
      });

      await this.publishEvent(SUBSCRIPTION_TRIAL_CONVERTED_EVENT, {
        subscriptionId: subscription.id,
        organisationId: subscription.organisationId,
        clientId: subscription.clientId,
        conversionType: 'PAID',
        paymentIntentId: chargeResult.paymentIntentId,
        invoiceId: chargeResult.invoiceId,
        occurredAt: this.now().toISOString(),
      });

      return {
        subscriptionId: subscription.id,
        status: 'CONVERTED',
        charge: chargeResult,
      };
    }

    if (chargeResult.status === 'FAILED') {
      return {
        subscriptionId: subscription.id,
        status: 'PAST_DUE',
        reason: chargeResult.reason,
        charge: chargeResult,
      };
    }

    return {
      subscriptionId: subscription.id,
      status: 'SKIPPED',
      reason: chargeResult.reason || 'CHARGE_SKIPPED',
      charge: chargeResult,
    };
  }

  private isWebDirectSubscription(subscription: SubscriptionEntity): boolean {
    const normalized = this.normalizeStoreSource(subscription.storeSource);
    return WEB_DIRECT_SOURCES.has(normalized);
  }

  private normalizeStoreSource(value: StoreSource | string | null | undefined): StoreSource {
    const normalized = String(value || StoreSource.NONE).trim().toUpperCase();
    if (Object.values(StoreSource).includes(normalized as StoreSource)) {
      return normalized as StoreSource;
    }
    return StoreSource.NONE;
  }

  private isTrialExpired(subscription: SubscriptionEntity): boolean {
    if (!subscription.trialEnd) {
      return true;
    }

    return subscription.trialEnd.getTime() <= this.now().getTime();
  }

  private now(): Date {
    return this.options.now?.() || new Date();
  }

  private async publishEvent(subject: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.natsService || !this.natsService.isConnected()) {
      this.logger.warn(`NATS indisponible, event ${subject} non publie`);
      return;
    }

    await this.natsService.publish(subject, payload);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
