import { Injectable } from '@nestjs/common';
import { DomainException } from '@crm/shared-kernel';
import type { SubscriptionEntity } from '../entities/subscription.entity';
import type { ISubscriptionRepository } from '../repositories/ISubscriptionRepository';

export enum SubscriptionFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  BIMONTHLY = 'BIMONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

const ACTIVE_STATUS = 'ACTIVE';

@Injectable()
export class SubscriptionSchedulingService {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  calculateNextChargeAt(frequency: string, currentPeriodEnd: string): string {
    const currentDate = this.parseDate(currentPeriodEnd, 'currentPeriodEnd');
    const normalizedFrequency = String(frequency || '').trim().toUpperCase();

    switch (normalizedFrequency) {
      case SubscriptionFrequency.WEEKLY:
        return this.addDays(currentDate, 7).toISOString();
      case SubscriptionFrequency.BIWEEKLY:
        return this.addDays(currentDate, 14).toISOString();
      case SubscriptionFrequency.MONTHLY:
        return this.addMonths(currentDate, 1).toISOString();
      case SubscriptionFrequency.BIMONTHLY:
        return this.addMonths(currentDate, 2).toISOString();
      case SubscriptionFrequency.QUARTERLY:
        return this.addMonths(currentDate, 3).toISOString();
      case SubscriptionFrequency.ANNUAL:
      case 'YEARLY':
        return this.addMonths(currentDate, 12).toISOString();
      default:
        throw new DomainException(
          `Unsupported subscription frequency: ${frequency}`,
          'SUBSCRIPTION_FREQUENCY_UNSUPPORTED',
          { frequency },
        );
    }
  }

  isChargeEligible(
    subscription: Pick<SubscriptionEntity, 'status' | 'nextChargeAt'>,
    now: Date = new Date(),
  ): boolean {
    if (subscription.status !== ACTIVE_STATUS) {
      return false;
    }

    const nextChargeDate = this.parseDate(subscription.nextChargeAt, 'nextChargeAt');
    return nextChargeDate.getTime() <= now.getTime();
  }

  async getDueSubscriptions(
    organisationId: string,
    beforeDate: Date,
  ): Promise<SubscriptionEntity[]> {
    const dueCandidates = await this.subscriptionRepository.findDueForCharge(
      organisationId,
      beforeDate.toISOString(),
    );

    return dueCandidates.filter((subscription) => this.isChargeEligible(subscription, beforeDate));
  }

  private parseDate(value: string, field: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new DomainException(
        `Invalid date value for ${field}`,
        'SUBSCRIPTION_INVALID_DATE',
        { field, value },
      );
    }

    return parsed;
  }

  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
  }

  private addMonths(date: Date, months: number): Date {
    const originalDay = date.getUTCDate();
    const target = new Date(date);

    target.setUTCDate(1);
    target.setUTCMonth(target.getUTCMonth() + months);

    const lastDayOfTargetMonth = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
    ).getUTCDate();

    target.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
    return target;
  }
}
