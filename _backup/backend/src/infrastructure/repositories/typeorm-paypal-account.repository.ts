import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PaypalAccountRepositoryPort } from '../../core/port/paypal-account-repository.port';
import type { PaypalAccountEntity as PaypalAccountDomainEntity } from '../../core/domain/paypal-account.entity';
import { PaypalAccountEntity as PaypalAccountOrmEntity } from '../db/entities/paypal-account.entity';
import { PaypalAccountMapper } from '../../applications/mapper/paypal-account.mapper';

@Injectable()
export class TypeOrmPaypalAccountRepository implements PaypalAccountRepositoryPort {
  constructor(
    @InjectRepository(PaypalAccountOrmEntity)
    private readonly repository: Repository<PaypalAccountOrmEntity>,
  ) {}

  async findById(id: string): Promise<PaypalAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? PaypalAccountMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<PaypalAccountDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => PaypalAccountMapper.toDomain(entity));
  }

  async findBySocieteId(societeId: string): Promise<PaypalAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { societeId } });
    return entity ? PaypalAccountMapper.toDomain(entity) : null;
  }

  async findAllActive(): Promise<PaypalAccountDomainEntity[]> {
    const entities = await this.repository.find({ where: { actif: true } });
    return entities.map((entity) => PaypalAccountMapper.toDomain(entity));
  }

  async create(entity: PaypalAccountDomainEntity): Promise<PaypalAccountDomainEntity> {
    const ormEntity = this.repository.create(
      PaypalAccountMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return PaypalAccountMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<PaypalAccountDomainEntity>,
  ): Promise<PaypalAccountDomainEntity> {
    await this.repository.update(
      id,
      PaypalAccountMapper.toPersistence(entity as PaypalAccountDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return PaypalAccountMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
