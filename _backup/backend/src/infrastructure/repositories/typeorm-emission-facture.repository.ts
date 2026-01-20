import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { EmissionFactureRepositoryPort } from '../../core/port/emission-facture-repository.port';
import type { EmissionFactureEntity as EmissionFactureDomainEntity } from '../../core/domain/emission-facture.entity';
import { EmissionFactureEntity as EmissionFactureOrmEntity } from '../db/entities/emission-facture.entity';
import { EmissionFactureMapper } from '../../applications/mapper/emission-facture.mapper';

@Injectable()
export class TypeOrmEmissionFactureRepository implements EmissionFactureRepositoryPort {
  constructor(
    @InjectRepository(EmissionFactureOrmEntity)
    private readonly repository: Repository<EmissionFactureOrmEntity>,
  ) {}

  async findById(id: string): Promise<EmissionFactureDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? EmissionFactureMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<EmissionFactureDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => EmissionFactureMapper.toDomain(entity));
  }

  async create(
    entity: EmissionFactureDomainEntity,
  ): Promise<EmissionFactureDomainEntity> {
    const ormEntity = this.repository.create(
      EmissionFactureMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return EmissionFactureMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<EmissionFactureDomainEntity>,
  ): Promise<EmissionFactureDomainEntity> {
    await this.repository.update(
      id,
      EmissionFactureMapper.toPersistence(
        entity as EmissionFactureDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return EmissionFactureMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
