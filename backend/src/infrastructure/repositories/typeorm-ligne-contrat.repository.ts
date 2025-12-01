import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { LigneContratRepositoryPort } from '../../core/port/ligne-contrat-repository.port';
import type { LigneContratEntity as LigneContratDomainEntity } from '../../core/domain/ligne-contrat.entity';
import { LigneContratEntity as LigneContratOrmEntity } from '../db/entities/ligne-contrat.entity';
import { LigneContratMapper } from '../../applications/mapper/ligne-contrat.mapper';

@Injectable()
export class TypeOrmLigneContratRepository
  implements LigneContratRepositoryPort
{
  constructor(
    @InjectRepository(LigneContratOrmEntity)
    private readonly repository: Repository<LigneContratOrmEntity>,
  ) {}

  async findById(id: string): Promise<LigneContratDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? LigneContratMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<LigneContratDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => LigneContratMapper.toDomain(entity));
  }

  async create(
    entity: LigneContratDomainEntity,
  ): Promise<LigneContratDomainEntity> {
    const ormEntity = this.repository.create(
      LigneContratMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return LigneContratMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<LigneContratDomainEntity>,
  ): Promise<LigneContratDomainEntity> {
    await this.repository.update(
      id,
      LigneContratMapper.toPersistence(entity as LigneContratDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return LigneContratMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
