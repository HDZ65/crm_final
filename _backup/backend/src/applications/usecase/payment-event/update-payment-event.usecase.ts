import { Injectable, Inject } from '@nestjs/common';
import { PaymentEventEntity } from '../../../core/domain/payment-event.entity';
import type { PaymentEventRepositoryPort } from '../../../core/port/payment-event-repository.port';
import { UpdatePaymentEventDto } from '../../dto/payment-event/update-payment-event.dto';

@Injectable()
export class UpdatePaymentEventUseCase {
  constructor(
    @Inject('PaymentEventRepositoryPort')
    private readonly repository: PaymentEventRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdatePaymentEventDto,
  ): Promise<PaymentEventEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('PaymentEvent not found');
    }

    const updated = new PaymentEventEntity({
      ...existing,
      processed: dto.processed ?? existing.processed,
      processedAt: dto.processedAt
        ? new Date(dto.processedAt)
        : existing.processedAt,
      errorMessage: dto.errorMessage ?? existing.errorMessage,
      updatedAt: new Date(),
    });

    return await this.repository.update(id, updated);
  }
}
