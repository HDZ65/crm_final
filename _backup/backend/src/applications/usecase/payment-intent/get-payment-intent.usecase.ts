import { Injectable, Inject } from '@nestjs/common';
import { PaymentIntentEntity } from '../../../core/domain/payment-intent.entity';
import type { PaymentIntentRepositoryPort } from '../../../core/port/payment-intent-repository.port';

@Injectable()
export class GetPaymentIntentUseCase {
  constructor(
    @Inject('PaymentIntentRepositoryPort')
    private readonly repository: PaymentIntentRepositoryPort,
  ) {}

  async execute(id: string): Promise<PaymentIntentEntity | null> {
    return await this.repository.findById(id);
  }

  async findAll(): Promise<PaymentIntentEntity[]> {
    return await this.repository.findAll();
  }

  async findByScheduleId(scheduleId: string): Promise<PaymentIntentEntity[]> {
    return await this.repository.findByScheduleId(scheduleId);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PaymentIntentEntity | null> {
    return await this.repository.findByIdempotencyKey(idempotencyKey);
  }

  async findByPspPaymentId(
    pspPaymentId: string,
  ): Promise<PaymentIntentEntity | null> {
    return await this.repository.findByPspPaymentId(pspPaymentId);
  }
}
