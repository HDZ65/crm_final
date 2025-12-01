import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { MembreGroupeRepositoryPort } from '../../core/port/membre-groupe-repository.port';
import type { MembreGroupeEntity as MembreGroupeDomainEntity } from '../../core/domain/membre-groupe.entity';
import { MembreGroupeEntity as MembreGroupeOrmEntity } from '../db/entities/membre-groupe.entity';
import { MembreGroupeMapper } from '../../applications/mapper/membre-groupe.mapper';

@Injectable()
export class TypeOrmMembreGroupeRepository
  implements MembreGroupeRepositoryPort
{
  constructor(
    @InjectRepository(MembreGroupeOrmEntity)
    private readonly repository: Repository<MembreGroupeOrmEntity>,
  ) {}

  async findById(id: string): Promise<MembreGroupeDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? MembreGroupeMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<MembreGroupeDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => MembreGroupeMapper.toDomain(entity));
  }

  async create(
    entity: MembreGroupeDomainEntity,
  ): Promise<MembreGroupeDomainEntity> {
    const ormEntity = this.repository.create(
      MembreGroupeMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return MembreGroupeMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<MembreGroupeDomainEntity>,
  ): Promise<MembreGroupeDomainEntity> {
    await this.repository.update(
      id,
      MembreGroupeMapper.toPersistence(entity as MembreGroupeDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return MembreGroupeMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
