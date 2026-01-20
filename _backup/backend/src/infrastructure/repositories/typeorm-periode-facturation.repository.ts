import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PeriodeFacturationRepositoryPort } from '../../core/port/periode-facturation-repository.port';
import type { PeriodeFacturationEntity as PeriodeFacturationDomainEntity } from '../../core/domain/periode-facturation.entity';
import { PeriodeFacturationEntity as PeriodeFacturationOrmEntity } from '../db/entities/periode-facturation.entity';
import { PeriodeFacturationMapper } from '../../applications/mapper/periode-facturation.mapper';

@Injectable()
export class TypeOrmPeriodeFacturationRepository implements PeriodeFacturationRepositoryPort {
  constructor(
    @InjectRepository(PeriodeFacturationOrmEntity)
    private readonly repository: Repository<PeriodeFacturationOrmEntity>,
  ) {}

  async findById(id: string): Promise<PeriodeFacturationDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? PeriodeFacturationMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<PeriodeFacturationDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => PeriodeFacturationMapper.toDomain(entity));
  }

  async create(
    entity: PeriodeFacturationDomainEntity,
  ): Promise<PeriodeFacturationDomainEntity> {
    const ormEntity = this.repository.create(
      PeriodeFacturationMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return PeriodeFacturationMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<PeriodeFacturationDomainEntity>,
  ): Promise<PeriodeFacturationDomainEntity> {
    await this.repository.update(
      id,
      PeriodeFacturationMapper.toPersistence(
        entity as PeriodeFacturationDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return PeriodeFacturationMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
