import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { StripeAccountRepositoryPort } from '../../core/port/stripe-account-repository.port';
import type { StripeAccountEntity as StripeAccountDomainEntity } from '../../core/domain/stripe-account.entity';
import { StripeAccountEntity as StripeAccountOrmEntity } from '../db/entities/stripe-account.entity';
import { StripeAccountMapper } from '../../applications/mapper/stripe-account.mapper';

@Injectable()
export class TypeOrmStripeAccountRepository implements StripeAccountRepositoryPort {
  constructor(
    @InjectRepository(StripeAccountOrmEntity)
    private readonly repository: Repository<StripeAccountOrmEntity>,
  ) {}

  async findById(id: string): Promise<StripeAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? StripeAccountMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<StripeAccountDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => StripeAccountMapper.toDomain(entity));
  }

  async findBySocieteId(societeId: string): Promise<StripeAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { societeId } });
    return entity ? StripeAccountMapper.toDomain(entity) : null;
  }

  async findAllActive(): Promise<StripeAccountDomainEntity[]> {
    const entities = await this.repository.find({ where: { actif: true } });
    return entities.map((entity) => StripeAccountMapper.toDomain(entity));
  }

  async create(entity: StripeAccountDomainEntity): Promise<StripeAccountDomainEntity> {
    const ormEntity = this.repository.create(
      StripeAccountMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return StripeAccountMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<StripeAccountDomainEntity>,
  ): Promise<StripeAccountDomainEntity> {
    await this.repository.update(
      id,
      StripeAccountMapper.toPersistence(entity as StripeAccountDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return StripeAccountMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
