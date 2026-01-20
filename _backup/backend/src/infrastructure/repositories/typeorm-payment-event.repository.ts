import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEventEntity as PaymentEventOrm } from '../db/entities/payment-event.entity';
import { PaymentEventEntity } from '../../core/domain/payment-event.entity';
import { PaymentEventRepositoryPort } from '../../core/port/payment-event-repository.port';
import { PaymentEventMapper } from '../../core/mapper/payment-event.mapper';

@Injectable()
export class TypeOrmPaymentEventRepository implements PaymentEventRepositoryPort {
  constructor(
    @InjectRepository(PaymentEventOrm)
    private readonly ormRepository: Repository<PaymentEventOrm>,
  ) {}

  async create(entity: PaymentEventEntity): Promise<PaymentEventEntity> {
    const ormEntity = this.ormRepository.create(
      PaymentEventMapper.toPersistence(entity),
    );
    const saved = await this.ormRepository.save(ormEntity);
    return PaymentEventMapper.toDomain(saved);
  }

  async findById(id: string): Promise<PaymentEventEntity | null> {
    const found = await this.ormRepository.findOne({ where: { id } });
    return found ? PaymentEventMapper.toDomain(found) : null;
  }

  async findAll(): Promise<PaymentEventEntity[]> {
    const entities = await this.ormRepository.find();
    return entities.map((e) => PaymentEventMapper.toDomain(e));
  }

  async update(
    id: string,
    entity: PaymentEventEntity,
  ): Promise<PaymentEventEntity> {
    await this.ormRepository.update(
      id,
      PaymentEventMapper.toPersistence(entity),
    );
    const updated = await this.ormRepository.findOne({ where: { id } });
    if (!updated) throw new Error('PaymentEvent not found after update');
    return PaymentEventMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }

  async findByPaymentIntentId(
    paymentIntentId: string,
  ): Promise<PaymentEventEntity[]> {
    const entities = await this.ormRepository.find({
      where: { paymentIntentId },
    });
    return entities.map((e) => PaymentEventMapper.toDomain(e));
  }

  async findByPspEventId(pspEventId: string): Promise<PaymentEventEntity | null> {
    const found = await this.ormRepository.findOne({ where: { pspEventId } });
    return found ? PaymentEventMapper.toDomain(found) : null;
  }

  async findUnprocessed(): Promise<PaymentEventEntity[]> {
    const entities = await this.ormRepository.find({
      where: { processed: false },
      order: { receivedAt: 'ASC' },
    });
    return entities.map((e) => PaymentEventMapper.toDomain(e));
  }
}
