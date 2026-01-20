import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { StatutClientRepositoryPort } from '../../core/port/statut-client-repository.port';
import type { StatutClientEntity as StatutClientDomainEntity } from '../../core/domain/statut-client.entity';
import { StatutClientEntity as StatutClientOrmEntity } from '../db/entities/statut-client.entity';
import { StatutClientMapper } from '../../applications/mapper/statut-client.mapper';

@Injectable()
export class TypeOrmStatutClientRepository implements StatutClientRepositoryPort {
  constructor(
    @InjectRepository(StatutClientOrmEntity)
    private readonly repository: Repository<StatutClientOrmEntity>,
  ) {}

  async findById(id: string): Promise<StatutClientDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? StatutClientMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<StatutClientDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => StatutClientMapper.toDomain(entity));
  }

  async create(
    entity: StatutClientDomainEntity,
  ): Promise<StatutClientDomainEntity> {
    const ormEntity = this.repository.create(
      StatutClientMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return StatutClientMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<StatutClientDomainEntity>,
  ): Promise<StatutClientDomainEntity> {
    await this.repository.update(
      id,
      StatutClientMapper.toPersistence(entity as StatutClientDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return StatutClientMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByCode(code: string): Promise<StatutClientDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { code } });
    return entity ? StatutClientMapper.toDomain(entity) : null;
  }
}
