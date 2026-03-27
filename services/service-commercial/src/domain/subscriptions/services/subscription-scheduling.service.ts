import { Injectable } from '@nestjs/common';
import { DomainException } from '@crm/shared-kernel';
import { SubscriptionStatus, type SubscriptionEntity } from '../entities/subscription.entity';
import type { ISubscriptionRepository } from '../repositories/ISubscriptionRepository';

export enum SubscriptionFrequency {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

@Injectable()
export class SubscriptionSchedulingService {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  calculateNextChargeAt(frequency: string, currentPeriodEnd: Date | string): Date {
    const currentDate = this.parseDate(currentPeriodEnd, 'currentPeriodEnd');
    const normalizedFrequency = String(frequency || '').trim().toUpperCase();

    switch (normalizedFrequency) {
      case SubscriptionFrequency.MONTHLY:
        return this.addMonths(currentDate, 1);
      case SubscriptionFrequency.ANNUAL:
      case 'YEARLY':
        return this.addMonths(currentDate, 12);
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
    if (subscription.status !== SubscriptionStatus.ACTIVE || !subscription.nextChargeAt) {
      return false;
    }

    const nextChargeDate = this.parseDate(subscription.nextChargeAt, 'nextChargeAt');
    return nextChargeDate.getTime() <= now.getTime();
  }

  isTrialExpired(
    subscription: Pick<SubscriptionEntity, 'status' | 'trialEnd'>,
    now: Date = new Date(),
  ): boolean {
    if (subscription.status !== SubscriptionStatus.TRIAL || !subscription.trialEnd) {
      return false;
    }

    return subscription.trialEnd.getTime() <= now.getTime();
  }

  async getDueForCharge(
    organisationId: string,
    beforeDate: Date,
  ): Promise<SubscriptionEntity[]> {
    if (typeof this.subscriptionRepository.getDueForCharge === 'function') {
      return this.subscriptionRepository.getDueForCharge(organisationId, beforeDate);
    }

    return this.subscriptionRepository.findDueForCharge(organisationId, beforeDate.toISOString());
  }

  async getDueForTrialConversion(
    organisationId: string,
    now: Date = new Date(),
  ): Promise<SubscriptionEntity[]> {
    const dueCandidates = await this.subscriptionRepository.getDueForTrialConversion(organisationId);
    return dueCandidates.filter((subscription) => this.isTrialExpired(subscription, now));
  }

  async getDueSubscriptions(
    organisationId: string,
    beforeDate: Date,
  ): Promise<SubscriptionEntity[]> {
    const dueCandidates = await this.getDueForCharge(organisationId, beforeDate);
    return dueCandidates.filter((subscription) => this.isChargeEligible(subscription, beforeDate));
  }

  private parseDate(value: Date | string, field: string): Date {
    const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new DomainException(
        `Invalid date value for ${field}`,
        'SUBSCRIPTION_INVALID_DATE',
        { field, value },
      );
    }

    return parsed;
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
