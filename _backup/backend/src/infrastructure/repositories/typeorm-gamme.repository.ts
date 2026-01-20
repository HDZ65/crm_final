import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { GammeRepositoryPort } from '../../core/port/gamme-repository.port';
import type { GammeEntity as GammeDomainEntity } from '../../core/domain/gamme.entity';
import { GammeEntity as GammeOrmEntity } from '../db/entities/gamme.entity';
import { GammeMapper } from '../../applications/mapper/gamme.mapper';

@Injectable()
export class TypeOrmGammeRepository implements GammeRepositoryPort {
  constructor(
    @InjectRepository(GammeOrmEntity)
    private readonly repository: Repository<GammeOrmEntity>,
  ) {}

  async findById(id: string): Promise<GammeDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? GammeMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<GammeDomainEntity[]> {
    const entities = await this.repository.find({ order: { nom: 'ASC' } });
    return entities.map((entity) => GammeMapper.toDomain(entity));
  }

  async findBySocieteId(societeId: string): Promise<GammeDomainEntity[]> {
    const entities = await this.repository.find({
      where: { societeId },
      order: { nom: 'ASC' },
    });
    return entities.map((entity) => GammeMapper.toDomain(entity));
  }

  async create(entity: GammeDomainEntity): Promise<GammeDomainEntity> {
    const ormEntity = this.repository.create(GammeMapper.toPersistence(entity));
    const saved = await this.repository.save(ormEntity);
    return GammeMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<GammeDomainEntity>,
  ): Promise<GammeDomainEntity> {
    await this.repository.update(
      id,
      GammeMapper.toPersistence(entity as GammeDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return GammeMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
