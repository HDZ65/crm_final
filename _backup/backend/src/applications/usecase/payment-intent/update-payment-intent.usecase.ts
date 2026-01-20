import { Injectable, Inject } from '@nestjs/common';
import { PaymentIntentEntity } from '../../../core/domain/payment-intent.entity';
import type { PaymentIntentRepositoryPort } from '../../../core/port/payment-intent-repository.port';
import { UpdatePaymentIntentDto } from '../../dto/payment-intent/update-payment-intent.dto';

@Injectable()
export class UpdatePaymentIntentUseCase {
  constructor(
    @Inject('PaymentIntentRepositoryPort')
    private readonly repository: PaymentIntentRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdatePaymentIntentDto,
  ): Promise<PaymentIntentEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('PaymentIntent not found');
    }

    const updated = new PaymentIntentEntity({
      ...existing,
      pspPaymentId: dto.pspPaymentId ?? existing.pspPaymentId,
      status: dto.status ?? existing.status,
      errorCode: dto.errorCode ?? existing.errorCode,
      errorMessage: dto.errorMessage ?? existing.errorMessage,
      metadata: dto.metadata ?? existing.metadata,
      updatedAt: new Date(),
    });

    return await this.repository.update(id, updated);
  }
}
