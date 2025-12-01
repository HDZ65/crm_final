import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { StatutCommissionRepositoryPort } from '../../core/port/statut-commission-repository.port';
import type { StatutCommissionEntity as StatutCommissionDomainEntity } from '../../core/domain/statut-commission.entity';
import { StatutCommissionEntity as StatutCommissionOrmEntity } from '../db/entities/statut-commission.entity';
import { StatutCommissionMapper } from '../../applications/mapper/statut-commission.mapper';

@Injectable()
export class TypeOrmStatutCommissionRepository
  implements StatutCommissionRepositoryPort
{
  constructor(
    @InjectRepository(StatutCommissionOrmEntity)
    private readonly repository: Repository<StatutCommissionOrmEntity>,
  ) {}

  async findById(id: string): Promise<StatutCommissionDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? StatutCommissionMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<StatutCommissionDomainEntity[]> {
    const entities = await this.repository.find({
      order: { ordreAffichage: 'ASC' },
    });
    return entities.map((entity) => StatutCommissionMapper.toDomain(entity));
  }

  async findByCode(code: string): Promise<StatutCommissionDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { code } });
    return entity ? StatutCommissionMapper.toDomain(entity) : null;
  }

  async create(
    entity: StatutCommissionDomainEntity,
  ): Promise<StatutCommissionDomainEntity> {
    const ormEntity = this.repository.create(
      StatutCommissionMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return StatutCommissionMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<StatutCommissionDomainEntity>,
  ): Promise<StatutCommissionDomainEntity> {
    await this.repository.update(
      id,
      StatutCommissionMapper.toPersistence(
        entity as StatutCommissionDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return StatutCommissionMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
