import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { GroupeRepositoryPort } from '../../core/port/groupe-repository.port';
import type { GroupeEntity as GroupeDomainEntity } from '../../core/domain/groupe.entity';
import { GroupeEntity as GroupeOrmEntity } from '../db/entities/groupe.entity';
import { GroupeMapper } from '../../applications/mapper/groupe.mapper';

@Injectable()
export class TypeOrmGroupeRepository implements GroupeRepositoryPort {
  constructor(
    @InjectRepository(GroupeOrmEntity)
    private readonly repository: Repository<GroupeOrmEntity>,
  ) {}

  async findById(id: string): Promise<GroupeDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? GroupeMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<GroupeDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => GroupeMapper.toDomain(entity));
  }

  async create(entity: GroupeDomainEntity): Promise<GroupeDomainEntity> {
    const ormEntity = this.repository.create(
      GroupeMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return GroupeMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<GroupeDomainEntity>,
  ): Promise<GroupeDomainEntity> {
    await this.repository.update(
      id,
      GroupeMapper.toPersistence(entity as GroupeDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return GroupeMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
