import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ColisRepositoryPort } from '../../core/port/colis-repository.port';
import type { ColisEntity as ColisDomainEntity } from '../../core/domain/colis.entity';
import { ColisEntity as ColisOrmEntity } from '../db/entities/colis.entity';
import { ColisMapper } from '../../applications/mapper/colis.mapper';

@Injectable()
export class TypeOrmColisRepository implements ColisRepositoryPort {
  constructor(
    @InjectRepository(ColisOrmEntity)
    private readonly repository: Repository<ColisOrmEntity>,
  ) {}

  async findById(id: string): Promise<ColisDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ColisMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ColisDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ColisMapper.toDomain(entity));
  }

  async create(entity: ColisDomainEntity): Promise<ColisDomainEntity> {
    const ormEntity = this.repository.create(ColisMapper.toPersistence(entity));
    const saved = await this.repository.save(ormEntity);
    return ColisMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ColisDomainEntity>,
  ): Promise<ColisDomainEntity> {
    await this.repository.update(
      id,
      ColisMapper.toPersistence(entity as ColisDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ColisMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
