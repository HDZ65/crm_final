import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ModeleDistributionRepositoryPort } from '../../core/port/modele-distribution-repository.port';
import type { ModeleDistributionEntity as ModeleDistributionDomainEntity } from '../../core/domain/modele-distribution.entity';
import { ModeleDistributionEntity as ModeleDistributionOrmEntity } from '../db/entities/modele-distribution.entity';
import { ModeleDistributionMapper } from '../../applications/mapper/modele-distribution.mapper';

@Injectable()
export class TypeOrmModeleDistributionRepository implements ModeleDistributionRepositoryPort {
  constructor(
    @InjectRepository(ModeleDistributionOrmEntity)
    private readonly repository: Repository<ModeleDistributionOrmEntity>,
  ) {}

  async findById(id: string): Promise<ModeleDistributionDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ModeleDistributionMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ModeleDistributionDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ModeleDistributionMapper.toDomain(entity));
  }

  async create(
    entity: ModeleDistributionDomainEntity,
  ): Promise<ModeleDistributionDomainEntity> {
    const ormEntity = this.repository.create(
      ModeleDistributionMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ModeleDistributionMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ModeleDistributionDomainEntity>,
  ): Promise<ModeleDistributionDomainEntity> {
    await this.repository.update(
      id,
      ModeleDistributionMapper.toPersistence(
        entity as ModeleDistributionDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ModeleDistributionMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
