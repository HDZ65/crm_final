import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CompteRepositoryPort } from '../../core/port/compte-repository.port';
import type { CompteEntity as CompteDomainEntity } from '../../core/domain/compte.entity';
import { CompteEntity as CompteOrmEntity } from '../db/entities/compte.entity';
import { CompteMapper } from '../../applications/mapper/compte.mapper';

@Injectable()
export class TypeOrmCompteRepository implements CompteRepositoryPort {
  constructor(
    @InjectRepository(CompteOrmEntity)
    private readonly repository: Repository<CompteOrmEntity>,
  ) {}

  async findById(id: string): Promise<CompteDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? CompteMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<CompteDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => CompteMapper.toDomain(entity));
  }

  async create(entity: CompteDomainEntity): Promise<CompteDomainEntity> {
    const ormEntity = this.repository.create(
      CompteMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return CompteMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<CompteDomainEntity>,
  ): Promise<CompteDomainEntity> {
    await this.repository.update(
      id,
      CompteMapper.toPersistence(entity as CompteDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return CompteMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
