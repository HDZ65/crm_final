import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentIntentEntity } from './entities/payment-intent.entity.js';
import { createHash } from 'crypto';

export class IdempotencyKeyConflictError extends ConflictException {
  constructor(
    public readonly idempotencyKey: string,
    public readonly existingPaymentIntentId: string,
  ) {
    super(
      `Idempotency key "${idempotencyKey}" already used for payment intent ${existingPaymentIntentId}. ` +
      `This payment has already been processed.`
    );
  }
}

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentRepository: Repository<PaymentIntentEntity>,
  ) {}

  generateKey(params: {
    societeId: string;
    clientId: string;
    amount: number;
    currency: string;
    scheduleId?: string;
    timestamp?: string;
  }): string {
    const data = [
      params.societeId,
      params.clientId,
      params.amount.toString(),
      params.currency,
      params.scheduleId || '',
      params.timestamp || new Date().toISOString().split('T')[0],
    ].join('|');

    return createHash('sha256').update(data).digest('hex').slice(0, 32);
  }

  async checkAndReserve(idempotencyKey: string): Promise<PaymentIntentEntity | null> {
    const existing = await this.paymentIntentRepository.findOne({
      where: { idempotencyKey },
    });

    return existing;
  }

  async validateOrThrow(idempotencyKey: string): Promise<void> {
    const existing = await this.checkAndReserve(idempotencyKey);

    if (existing) {
      throw new IdempotencyKeyConflictError(idempotencyKey, existing.id);
    }
  }

  async findByKey(idempotencyKey: string): Promise<PaymentIntentEntity | null> {
    return this.paymentIntentRepository.findOne({
      where: { idempotencyKey },
    });
  }
}
