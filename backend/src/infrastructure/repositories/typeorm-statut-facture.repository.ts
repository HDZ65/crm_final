import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { StatutFactureRepositoryPort } from '../../core/port/statut-facture-repository.port';
import type { StatutFactureEntity as StatutFactureDomainEntity } from '../../core/domain/statut-facture.entity';
import { StatutFactureEntity as StatutFactureOrmEntity } from '../db/entities/statut-facture.entity';
import { StatutFactureMapper } from '../../applications/mapper/statut-facture.mapper';

@Injectable()
export class TypeOrmStatutFactureRepository
  implements StatutFactureRepositoryPort
{
  constructor(
    @InjectRepository(StatutFactureOrmEntity)
    private readonly repository: Repository<StatutFactureOrmEntity>,
  ) {}

  async findById(id: string): Promise<StatutFactureDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? StatutFactureMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<StatutFactureDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => StatutFactureMapper.toDomain(entity));
  }

  async create(
    entity: StatutFactureDomainEntity,
  ): Promise<StatutFactureDomainEntity> {
    const ormEntity = this.repository.create(
      StatutFactureMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return StatutFactureMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<StatutFactureDomainEntity>,
  ): Promise<StatutFactureDomainEntity> {
    await this.repository.update(
      id,
      StatutFactureMapper.toPersistence(entity as StatutFactureDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return StatutFactureMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
