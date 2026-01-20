import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { GoCardlessAccountRepositoryPort } from '../../core/port/gocardless-account-repository.port';
import type { GoCardlessAccountEntity as GoCardlessAccountDomainEntity } from '../../core/domain/gocardless-account.entity';
import { GoCardlessAccountEntity as GoCardlessAccountOrmEntity } from '../db/entities/gocardless-account.entity';
import { GoCardlessAccountMapper } from '../../applications/mapper/gocardless-account.mapper';

@Injectable()
export class TypeOrmGoCardlessAccountRepository implements GoCardlessAccountRepositoryPort {
  constructor(
    @InjectRepository(GoCardlessAccountOrmEntity)
    private readonly repository: Repository<GoCardlessAccountOrmEntity>,
  ) {}

  async findById(id: string): Promise<GoCardlessAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? GoCardlessAccountMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<GoCardlessAccountDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => GoCardlessAccountMapper.toDomain(entity));
  }

  async findBySocieteId(societeId: string): Promise<GoCardlessAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { societeId } });
    return entity ? GoCardlessAccountMapper.toDomain(entity) : null;
  }

  async findAllActive(): Promise<GoCardlessAccountDomainEntity[]> {
    const entities = await this.repository.find({ where: { actif: true } });
    return entities.map((entity) => GoCardlessAccountMapper.toDomain(entity));
  }

  async create(entity: GoCardlessAccountDomainEntity): Promise<GoCardlessAccountDomainEntity> {
    const ormEntity = this.repository.create(
      GoCardlessAccountMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return GoCardlessAccountMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<GoCardlessAccountDomainEntity>,
  ): Promise<GoCardlessAccountDomainEntity> {
    await this.repository.update(
      id,
      GoCardlessAccountMapper.toPersistence(entity as GoCardlessAccountDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return GoCardlessAccountMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
