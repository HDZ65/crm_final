import { Injectable, Inject } from '@nestjs/common';
import { PaymentIntentEntity } from '../../../core/domain/payment-intent.entity';
import type { PaymentIntentRepositoryPort } from '../../../core/port/payment-intent-repository.port';
import { CreatePaymentIntentDto } from '../../dto/payment-intent/create-payment-intent.dto';
import { PaymentIntentStatus } from '../../../core/domain/payment.enums';

@Injectable()
export class CreatePaymentIntentUseCase {
  constructor(
    @Inject('PaymentIntentRepositoryPort')
    private readonly repository: PaymentIntentRepositoryPort,
  ) {}

  async execute(dto: CreatePaymentIntentDto): Promise<PaymentIntentEntity> {
    const entity = new PaymentIntentEntity({
      organisationId: dto.organisationId,
      scheduleId: dto.scheduleId,
      pspName: dto.pspName,
      pspPaymentId: dto.pspPaymentId ?? null,
      amount: dto.amount,
      currency: dto.currency ?? 'EUR',
      status: dto.status ?? PaymentIntentStatus.PENDING,
      idempotencyKey: dto.idempotencyKey,
      mandateReference: dto.mandateReference ?? null,
      metadata: dto.metadata ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
