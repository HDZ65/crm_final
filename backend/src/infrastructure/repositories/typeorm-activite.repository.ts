import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ActiviteRepositoryPort } from '../../core/port/activite-repository.port';
import type { ActiviteEntity as ActiviteDomainEntity } from '../../core/domain/activite.entity';
import { ActiviteEntity as ActiviteOrmEntity } from '../db/entities/activite.entity';
import { ActiviteMapper } from '../../applications/mapper/activite.mapper';

@Injectable()
export class TypeOrmActiviteRepository implements ActiviteRepositoryPort {
  constructor(
    @InjectRepository(ActiviteOrmEntity)
    private readonly repository: Repository<ActiviteOrmEntity>,
  ) {}

  async findById(id: string): Promise<ActiviteDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ActiviteMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ActiviteDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ActiviteMapper.toDomain(entity));
  }

  async create(entity: ActiviteDomainEntity): Promise<ActiviteDomainEntity> {
    const ormEntity = this.repository.create(
      ActiviteMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ActiviteMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ActiviteDomainEntity>,
  ): Promise<ActiviteDomainEntity> {
    await this.repository.update(
      id,
      ActiviteMapper.toPersistence(entity as ActiviteDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ActiviteMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
