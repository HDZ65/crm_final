import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ConditionPaiementRepositoryPort } from '../../core/port/condition-paiement-repository.port';
import type { ConditionPaiementEntity as ConditionPaiementDomainEntity } from '../../core/domain/condition-paiement.entity';
import { ConditionPaiementEntity as ConditionPaiementOrmEntity } from '../db/entities/condition-paiement.entity';
import { ConditionPaiementMapper } from '../../applications/mapper/condition-paiement.mapper';

@Injectable()
export class TypeOrmConditionPaiementRepository
  implements ConditionPaiementRepositoryPort
{
  constructor(
    @InjectRepository(ConditionPaiementOrmEntity)
    private readonly repository: Repository<ConditionPaiementOrmEntity>,
  ) {}

  async findById(id: string): Promise<ConditionPaiementDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ConditionPaiementMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ConditionPaiementDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ConditionPaiementMapper.toDomain(entity));
  }

  async create(
    entity: ConditionPaiementDomainEntity,
  ): Promise<ConditionPaiementDomainEntity> {
    const ormEntity = this.repository.create(
      ConditionPaiementMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ConditionPaiementMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ConditionPaiementDomainEntity>,
  ): Promise<ConditionPaiementDomainEntity> {
    await this.repository.update(
      id,
      ConditionPaiementMapper.toPersistence(
        entity as ConditionPaiementDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ConditionPaiementMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
