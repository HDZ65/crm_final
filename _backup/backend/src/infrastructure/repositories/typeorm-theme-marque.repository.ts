import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ThemeMarqueRepositoryPort } from '../../core/port/theme-marque-repository.port';
import type { ThemeMarqueEntity as ThemeMarqueDomainEntity } from '../../core/domain/theme-marque.entity';
import { ThemeMarqueEntity as ThemeMarqueOrmEntity } from '../db/entities/theme-marque.entity';
import { ThemeMarqueMapper } from '../../applications/mapper/theme-marque.mapper';

@Injectable()
export class TypeOrmThemeMarqueRepository implements ThemeMarqueRepositoryPort {
  constructor(
    @InjectRepository(ThemeMarqueOrmEntity)
    private readonly repository: Repository<ThemeMarqueOrmEntity>,
  ) {}

  async findById(id: string): Promise<ThemeMarqueDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ThemeMarqueMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ThemeMarqueDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ThemeMarqueMapper.toDomain(entity));
  }

  async create(
    entity: ThemeMarqueDomainEntity,
  ): Promise<ThemeMarqueDomainEntity> {
    const ormEntity = this.repository.create(
      ThemeMarqueMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ThemeMarqueMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ThemeMarqueDomainEntity>,
  ): Promise<ThemeMarqueDomainEntity> {
    await this.repository.update(
      id,
      ThemeMarqueMapper.toPersistence(entity as ThemeMarqueDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ThemeMarqueMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
