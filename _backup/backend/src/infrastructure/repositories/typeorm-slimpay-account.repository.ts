import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SlimpayAccountRepositoryPort } from '../../core/port/slimpay-account-repository.port';
import type { SlimpayAccountEntity as SlimpayAccountDomainEntity } from '../../core/domain/slimpay-account.entity';
import { SlimpayAccountEntity as SlimpayAccountOrmEntity } from '../db/entities/slimpay-account.entity';
import { SlimpayAccountMapper } from '../../applications/mapper/slimpay-account.mapper';

@Injectable()
export class TypeOrmSlimpayAccountRepository implements SlimpayAccountRepositoryPort {
  constructor(
    @InjectRepository(SlimpayAccountOrmEntity)
    private readonly repository: Repository<SlimpayAccountOrmEntity>,
  ) {}

  async findById(id: string): Promise<SlimpayAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? SlimpayAccountMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<SlimpayAccountDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => SlimpayAccountMapper.toDomain(entity));
  }

  async findBySocieteId(societeId: string): Promise<SlimpayAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { societeId } });
    return entity ? SlimpayAccountMapper.toDomain(entity) : null;
  }

  async findAllActive(): Promise<SlimpayAccountDomainEntity[]> {
    const entities = await this.repository.find({ where: { actif: true } });
    return entities.map((entity) => SlimpayAccountMapper.toDomain(entity));
  }

  async create(entity: SlimpayAccountDomainEntity): Promise<SlimpayAccountDomainEntity> {
    const ormEntity = this.repository.create(
      SlimpayAccountMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return SlimpayAccountMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<SlimpayAccountDomainEntity>,
  ): Promise<SlimpayAccountDomainEntity> {
    await this.repository.update(
      id,
      SlimpayAccountMapper.toPersistence(entity as SlimpayAccountDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return SlimpayAccountMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
