import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { StatutContratRepositoryPort } from '../../core/port/statut-contrat-repository.port';
import type { StatutContratEntity as StatutContratDomainEntity } from '../../core/domain/statut-contrat.entity';
import { StatutContratEntity as StatutContratOrmEntity } from '../db/entities/statut-contrat.entity';
import { StatutContratMapper } from '../../applications/mapper/statut-contrat.mapper';

@Injectable()
export class TypeOrmStatutContratRepository
  implements StatutContratRepositoryPort
{
  constructor(
    @InjectRepository(StatutContratOrmEntity)
    private readonly repository: Repository<StatutContratOrmEntity>,
  ) {}

  async findById(id: string): Promise<StatutContratDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? StatutContratMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<StatutContratDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => StatutContratMapper.toDomain(entity));
  }

  async create(
    entity: StatutContratDomainEntity,
  ): Promise<StatutContratDomainEntity> {
    const ormEntity = this.repository.create(
      StatutContratMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return StatutContratMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<StatutContratDomainEntity>,
  ): Promise<StatutContratDomainEntity> {
    await this.repository.update(
      id,
      StatutContratMapper.toPersistence(entity as StatutContratDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return StatutContratMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
