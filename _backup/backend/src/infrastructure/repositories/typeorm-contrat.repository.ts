import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ContratRepositoryPort } from '../../core/port/contrat-repository.port';
import type { ContratEntity as ContratDomainEntity } from '../../core/domain/contrat.entity';
import { ContratEntity as ContratOrmEntity } from '../db/entities/contrat.entity';
import { ContratMapper } from '../../applications/mapper/contrat.mapper';

@Injectable()
export class TypeOrmContratRepository implements ContratRepositoryPort {
  constructor(
    @InjectRepository(ContratOrmEntity)
    private readonly repository: Repository<ContratOrmEntity>,
  ) {}

  async findById(id: string): Promise<ContratDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ContratMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ContratDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ContratMapper.toDomain(entity));
  }

  async create(entity: ContratDomainEntity): Promise<ContratDomainEntity> {
    const ormEntity = this.repository.create(
      ContratMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ContratMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ContratDomainEntity>,
  ): Promise<ContratDomainEntity> {
    await this.repository.update(
      id,
      ContratMapper.toPersistence(entity as ContratDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ContratMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
