import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { GoCardlessService } from '../../../infrastructure/services/gocardless.service';
import type { GoCardlessMandateRepositoryPort } from '../../../core/port/gocardless-mandate-repository.port';
import {
  CreateGoCardlessSubscriptionDto,
  GoCardlessSubscriptionResponseDto,
} from '../../dto/gocardless/create-subscription.dto';
import { GetGoCardlessMandateUseCase } from './get-gocardless-mandate.usecase';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateGoCardlessSubscriptionUseCase {
  private readonly logger = new Logger(CreateGoCardlessSubscriptionUseCase.name);

  constructor(
    private readonly gocardlessService: GoCardlessService,
    private readonly getMandateUseCase: GetGoCardlessMandateUseCase,
    @Inject('GoCardlessMandateRepositoryPort')
    private readonly repository: GoCardlessMandateRepositoryPort,
  ) {}

  async execute(
    dto: CreateGoCardlessSubscriptionDto,
  ): Promise<GoCardlessSubscriptionResponseDto> {
    // Verify mandate exists and is active
    const mandateRecord = await this.getMandateUseCase.executeByMandateId(dto.mandateId);
    if (!mandateRecord) {
      throw new NotFoundException(`Mandate ${dto.mandateId} not found in database`);
    }

    if (!mandateRecord.isActive()) {
      throw new Error(
        `Mandate ${dto.mandateId} is not active (status: ${mandateRecord.mandateStatus})`,
      );
    }

    this.logger.log(
      `Creating ${dto.intervalUnit || 'monthly'} subscription of ${dto.amount} ${dto.currency || 'EUR'} for mandate ${dto.mandateId}`,
    );

    const subscription = await this.gocardlessService.createSubscription(
      dto.mandateId,
      dto.amount,
      dto.currency || 'EUR',
      {
        name: dto.name,
        intervalUnit: dto.intervalUnit || 'monthly',
        dayOfMonth: dto.dayOfMonth,
        count: dto.count,
        startDate: dto.startDate,
        metadata: dto.metadata,
        idempotencyKey: uuidv4(),
      },
    );

    // Update mandate record with subscription info
    await this.repository.update(mandateRecord.id, {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      nextChargeDate: subscription.upcoming_payments?.[0]?.charge_date
        ? new Date(subscription.upcoming_payments[0].charge_date)
        : undefined,
    });

    return new GoCardlessSubscriptionResponseDto(subscription);
  }

  async executeByClientId(
    clientId: string,
    amount: number,
    currency: string = 'EUR',
    options?: {
      name?: string;
      intervalUnit?: 'weekly' | 'monthly' | 'yearly';
      dayOfMonth?: number;
      count?: number;
      startDate?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<GoCardlessSubscriptionResponseDto> {
    // Find active mandate for client
    const mandateRecord = await this.getMandateUseCase.executeActiveByClientId(clientId);
    if (!mandateRecord) {
      throw new NotFoundException(`No active mandate found for client ${clientId}`);
    }

    return this.execute({
      mandateId: mandateRecord.mandateId,
      amount,
      currency,
      ...options,
    });
  }
}
