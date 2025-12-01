import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { StatutPartenaireRepositoryPort } from '../../core/port/statut-partenaire-repository.port';
import type { StatutPartenaireEntity as StatutPartenaireDomainEntity } from '../../core/domain/statut-partenaire.entity';
import { StatutPartenaireEntity as StatutPartenaireOrmEntity } from '../db/entities/statut-partenaire.entity';
import { StatutPartenaireMapper } from '../../applications/mapper/statut-partenaire.mapper';

@Injectable()
export class TypeOrmStatutPartenaireRepository
  implements StatutPartenaireRepositoryPort
{
  constructor(
    @InjectRepository(StatutPartenaireOrmEntity)
    private readonly repository: Repository<StatutPartenaireOrmEntity>,
  ) {}

  async findById(id: string): Promise<StatutPartenaireDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? StatutPartenaireMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<StatutPartenaireDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => StatutPartenaireMapper.toDomain(entity));
  }

  async create(
    entity: StatutPartenaireDomainEntity,
  ): Promise<StatutPartenaireDomainEntity> {
    const ormEntity = this.repository.create(
      StatutPartenaireMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return StatutPartenaireMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<StatutPartenaireDomainEntity>,
  ): Promise<StatutPartenaireDomainEntity> {
    await this.repository.update(
      id,
      StatutPartenaireMapper.toPersistence(
        entity as StatutPartenaireDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return StatutPartenaireMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
