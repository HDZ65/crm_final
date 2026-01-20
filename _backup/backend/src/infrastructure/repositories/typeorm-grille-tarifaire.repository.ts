import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { GrilleTarifaireRepositoryPort } from '../../core/port/grille-tarifaire-repository.port';
import type { GrilleTarifaireEntity as GrilleTarifaireDomainEntity } from '../../core/domain/grille-tarifaire.entity';
import { GrilleTarifaireEntity as GrilleTarifaireOrmEntity } from '../db/entities/grille-tarifaire.entity';
import { GrilleTarifaireMapper } from '../../applications/mapper/grille-tarifaire.mapper';

@Injectable()
export class TypeOrmGrilleTarifaireRepository implements GrilleTarifaireRepositoryPort {
  constructor(
    @InjectRepository(GrilleTarifaireOrmEntity)
    private readonly repository: Repository<GrilleTarifaireOrmEntity>,
  ) {}

  async findById(id: string): Promise<GrilleTarifaireDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? GrilleTarifaireMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<GrilleTarifaireDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => GrilleTarifaireMapper.toDomain(entity));
  }

  async create(
    entity: GrilleTarifaireDomainEntity,
  ): Promise<GrilleTarifaireDomainEntity> {
    const ormEntity = this.repository.create(
      GrilleTarifaireMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return GrilleTarifaireMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<GrilleTarifaireDomainEntity>,
  ): Promise<GrilleTarifaireDomainEntity> {
    await this.repository.update(
      id,
      GrilleTarifaireMapper.toPersistence(
        entity as GrilleTarifaireDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return GrilleTarifaireMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
