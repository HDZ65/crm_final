import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { MultisafepayAccountRepositoryPort } from '../../core/port/multisafepay-account-repository.port';
import type { MultisafepayAccountEntity as MultisafepayAccountDomainEntity } from '../../core/domain/multisafepay-account.entity';
import { MultisafepayAccountEntity as MultisafepayAccountOrmEntity } from '../db/entities/multisafepay-account.entity';
import { MultisafepayAccountMapper } from '../../applications/mapper/multisafepay-account.mapper';

@Injectable()
export class TypeOrmMultisafepayAccountRepository implements MultisafepayAccountRepositoryPort {
  constructor(
    @InjectRepository(MultisafepayAccountOrmEntity)
    private readonly repository: Repository<MultisafepayAccountOrmEntity>,
  ) {}

  async findById(id: string): Promise<MultisafepayAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? MultisafepayAccountMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<MultisafepayAccountDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => MultisafepayAccountMapper.toDomain(entity));
  }

  async findBySocieteId(societeId: string): Promise<MultisafepayAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { societeId } });
    return entity ? MultisafepayAccountMapper.toDomain(entity) : null;
  }

  async findAllActive(): Promise<MultisafepayAccountDomainEntity[]> {
    const entities = await this.repository.find({ where: { actif: true } });
    return entities.map((entity) => MultisafepayAccountMapper.toDomain(entity));
  }

  async create(entity: MultisafepayAccountDomainEntity): Promise<MultisafepayAccountDomainEntity> {
    const ormEntity = this.repository.create(
      MultisafepayAccountMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return MultisafepayAccountMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<MultisafepayAccountDomainEntity>,
  ): Promise<MultisafepayAccountDomainEntity> {
    await this.repository.update(
      id,
      MultisafepayAccountMapper.toPersistence(entity as MultisafepayAccountDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return MultisafepayAccountMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
