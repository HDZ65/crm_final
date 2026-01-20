import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { GoCardlessMandateRepositoryPort } from '../../core/port/gocardless-mandate-repository.port';
import type { GoCardlessMandateEntity as GoCardlessMandateDomainEntity } from '../../core/domain/gocardless-mandate.entity';
import { GoCardlessMandateEntity as GoCardlessMandateOrmEntity } from '../db/entities/gocardless-mandate.entity';
import { GoCardlessMandateMapper } from '../../applications/mapper/gocardless-mandate.mapper';

@Injectable()
export class TypeOrmGoCardlessMandateRepository
  implements GoCardlessMandateRepositoryPort
{
  constructor(
    @InjectRepository(GoCardlessMandateOrmEntity)
    private readonly repository: Repository<GoCardlessMandateOrmEntity>,
  ) {}

  async findById(id: string): Promise<GoCardlessMandateDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? GoCardlessMandateMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<GoCardlessMandateDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => GoCardlessMandateMapper.toDomain(entity));
  }

  async create(
    entity: GoCardlessMandateDomainEntity,
  ): Promise<GoCardlessMandateDomainEntity> {
    const ormEntity = this.repository.create(
      GoCardlessMandateMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return GoCardlessMandateMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<GoCardlessMandateDomainEntity>,
  ): Promise<GoCardlessMandateDomainEntity> {
    await this.repository.update(
      id,
      GoCardlessMandateMapper.toPersistence(
        entity as GoCardlessMandateDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return GoCardlessMandateMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByClientId(
    clientId: string,
  ): Promise<GoCardlessMandateDomainEntity[]> {
    const entities = await this.repository.find({ where: { clientId } });
    return entities.map((entity) => GoCardlessMandateMapper.toDomain(entity));
  }

  async findByMandateId(
    mandateId: string,
  ): Promise<GoCardlessMandateDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { mandateId } });
    return entity ? GoCardlessMandateMapper.toDomain(entity) : null;
  }

  async findByGocardlessCustomerId(
    gocardlessCustomerId: string,
  ): Promise<GoCardlessMandateDomainEntity[]> {
    const entities = await this.repository.find({
      where: { gocardlessCustomerId },
    });
    return entities.map((entity) => GoCardlessMandateMapper.toDomain(entity));
  }

  async findActiveByClientId(
    clientId: string,
  ): Promise<GoCardlessMandateDomainEntity | null> {
    const entity = await this.repository.findOne({
      where: { clientId, mandateStatus: 'active' },
    });
    return entity ? GoCardlessMandateMapper.toDomain(entity) : null;
  }

  async findBySubscriptionId(
    subscriptionId: string,
  ): Promise<GoCardlessMandateDomainEntity | null> {
    const entity = await this.repository.findOne({
      where: { subscriptionId },
    });
    return entity ? GoCardlessMandateMapper.toDomain(entity) : null;
  }
}
