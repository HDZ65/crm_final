import { Injectable, Inject } from '@nestjs/common';
import { PaymentEventEntity } from '../../../core/domain/payment-event.entity';
import type { PaymentEventRepositoryPort } from '../../../core/port/payment-event-repository.port';
import { CreatePaymentEventDto } from '../../dto/payment-event/create-payment-event.dto';

@Injectable()
export class CreatePaymentEventUseCase {
  constructor(
    @Inject('PaymentEventRepositoryPort')
    private readonly repository: PaymentEventRepositoryPort,
  ) {}

  async execute(dto: CreatePaymentEventDto): Promise<PaymentEventEntity> {
    const entity = new PaymentEventEntity({
      pspEventId: dto.pspEventId,
      organisationId: dto.organisationId,
      paymentIntentId: dto.paymentIntentId,
      eventType: dto.eventType,
      rawPayload: dto.rawPayload,
      receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
      processed: dto.processed ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
