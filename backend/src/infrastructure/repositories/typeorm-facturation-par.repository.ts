import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { FacturationParRepositoryPort } from '../../core/port/facturation-par-repository.port';
import type { FacturationParEntity as FacturationParDomainEntity } from '../../core/domain/facturation-par.entity';
import { FacturationParEntity as FacturationParOrmEntity } from '../db/entities/facturation-par.entity';
import { FacturationParMapper } from '../../applications/mapper/facturation-par.mapper';

@Injectable()
export class TypeOrmFacturationParRepository
  implements FacturationParRepositoryPort
{
  constructor(
    @InjectRepository(FacturationParOrmEntity)
    private readonly repository: Repository<FacturationParOrmEntity>,
  ) {}

  async findById(id: string): Promise<FacturationParDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? FacturationParMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<FacturationParDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => FacturationParMapper.toDomain(entity));
  }

  async create(
    entity: FacturationParDomainEntity,
  ): Promise<FacturationParDomainEntity> {
    const ormEntity = this.repository.create(
      FacturationParMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return FacturationParMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<FacturationParDomainEntity>,
  ): Promise<FacturationParDomainEntity> {
    await this.repository.update(
      id,
      FacturationParMapper.toPersistence(entity as FacturationParDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return FacturationParMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
