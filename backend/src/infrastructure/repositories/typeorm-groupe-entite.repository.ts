import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { GroupeEntiteRepositoryPort } from '../../core/port/groupe-entite-repository.port';
import type { GroupeEntiteEntity as GroupeEntiteDomainEntity } from '../../core/domain/groupe-entite.entity';
import { GroupeEntiteEntity as GroupeEntiteOrmEntity } from '../db/entities/groupe-entite.entity';
import { GroupeEntiteMapper } from '../../applications/mapper/groupe-entite.mapper';

@Injectable()
export class TypeOrmGroupeEntiteRepository
  implements GroupeEntiteRepositoryPort
{
  constructor(
    @InjectRepository(GroupeEntiteOrmEntity)
    private readonly repository: Repository<GroupeEntiteOrmEntity>,
  ) {}

  async findById(id: string): Promise<GroupeEntiteDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? GroupeEntiteMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<GroupeEntiteDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => GroupeEntiteMapper.toDomain(entity));
  }

  async findByGroupeAndEntite(groupeId: string, entiteId: string): Promise<GroupeEntiteDomainEntity | null> {
    const entity = await this.repository.findOne({
      where: { groupeId, entiteId },
    });
    return entity ? GroupeEntiteMapper.toDomain(entity) : null;
  }

  async findByEntiteId(entiteId: string): Promise<GroupeEntiteDomainEntity | null> {
    const entity = await this.repository.findOne({
      where: { entiteId },
    });
    return entity ? GroupeEntiteMapper.toDomain(entity) : null;
  }

  async create(
    entity: GroupeEntiteDomainEntity,
  ): Promise<GroupeEntiteDomainEntity> {
    const ormEntity = this.repository.create(
      GroupeEntiteMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return GroupeEntiteMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<GroupeEntiteDomainEntity>,
  ): Promise<GroupeEntiteDomainEntity> {
    await this.repository.update(
      id,
      GroupeEntiteMapper.toPersistence(entity as GroupeEntiteDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return GroupeEntiteMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
