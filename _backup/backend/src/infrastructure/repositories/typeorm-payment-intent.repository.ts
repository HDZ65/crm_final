import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentIntentEntity as PaymentIntentOrm } from '../db/entities/payment-intent.entity';
import { PaymentIntentEntity } from '../../core/domain/payment-intent.entity';
import { PaymentIntentRepositoryPort } from '../../core/port/payment-intent-repository.port';
import { PaymentIntentMapper } from '../../core/mapper/payment-intent.mapper';

@Injectable()
export class TypeOrmPaymentIntentRepository implements PaymentIntentRepositoryPort {
  constructor(
    @InjectRepository(PaymentIntentOrm)
    private readonly ormRepository: Repository<PaymentIntentOrm>,
  ) {}

  async create(entity: PaymentIntentEntity): Promise<PaymentIntentEntity> {
    const ormEntity = this.ormRepository.create(
      PaymentIntentMapper.toPersistence(entity),
    );
    const saved = await this.ormRepository.save(ormEntity);
    return PaymentIntentMapper.toDomain(saved);
  }

  async findById(id: string): Promise<PaymentIntentEntity | null> {
    const found = await this.ormRepository.findOne({ where: { id } });
    return found ? PaymentIntentMapper.toDomain(found) : null;
  }

  async findAll(): Promise<PaymentIntentEntity[]> {
    const entities = await this.ormRepository.find();
    return entities.map((e) => PaymentIntentMapper.toDomain(e));
  }

  async update(
    id: string,
    entity: PaymentIntentEntity,
  ): Promise<PaymentIntentEntity> {
    await this.ormRepository.update(
      id,
      PaymentIntentMapper.toPersistence(entity),
    );
    const updated = await this.ormRepository.findOne({ where: { id } });
    if (!updated) throw new Error('PaymentIntent not found after update');
    return PaymentIntentMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }

  async findByScheduleId(scheduleId: string): Promise<PaymentIntentEntity[]> {
    const entities = await this.ormRepository.find({ where: { scheduleId } });
    return entities.map((e) => PaymentIntentMapper.toDomain(e));
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PaymentIntentEntity | null> {
    const found = await this.ormRepository.findOne({
      where: { idempotencyKey },
    });
    return found ? PaymentIntentMapper.toDomain(found) : null;
  }

  async findByPspPaymentId(
    pspPaymentId: string,
  ): Promise<PaymentIntentEntity | null> {
    const found = await this.ormRepository.findOne({
      where: { pspPaymentId },
    });
    return found ? PaymentIntentMapper.toDomain(found) : null;
  }
}
