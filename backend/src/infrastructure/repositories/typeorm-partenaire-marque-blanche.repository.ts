import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PartenaireMarqueBlancheRepositoryPort } from '../../core/port/partenaire-marque-blanche-repository.port';
import type { PartenaireMarqueBlancheEntity as PartenaireMarqueBlancheDomainEntity } from '../../core/domain/partenaire-marque-blanche.entity';
import { PartenaireMarqueBlancheEntity as PartenaireMarqueBlancheOrmEntity } from '../db/entities/partenaire-marque-blanche.entity';
import { PartenaireMarqueBlancheMapper } from '../../applications/mapper/partenaire-marque-blanche.mapper';

@Injectable()
export class TypeOrmPartenaireMarqueBlancheRepository
  implements PartenaireMarqueBlancheRepositoryPort
{
  constructor(
    @InjectRepository(PartenaireMarqueBlancheOrmEntity)
    private readonly repository: Repository<PartenaireMarqueBlancheOrmEntity>,
  ) {}

  async findById(
    id: string,
  ): Promise<PartenaireMarqueBlancheDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? PartenaireMarqueBlancheMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<PartenaireMarqueBlancheDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) =>
      PartenaireMarqueBlancheMapper.toDomain(entity),
    );
  }

  async create(
    entity: PartenaireMarqueBlancheDomainEntity,
  ): Promise<PartenaireMarqueBlancheDomainEntity> {
    const ormEntity = this.repository.create(
      PartenaireMarqueBlancheMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return PartenaireMarqueBlancheMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<PartenaireMarqueBlancheDomainEntity>,
  ): Promise<PartenaireMarqueBlancheDomainEntity> {
    await this.repository.update(
      id,
      PartenaireMarqueBlancheMapper.toPersistence(
        entity as PartenaireMarqueBlancheDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return PartenaireMarqueBlancheMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
