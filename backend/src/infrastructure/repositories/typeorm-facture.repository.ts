import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { FactureRepositoryPort } from '../../core/port/facture-repository.port';
import type { FactureEntity as FactureDomainEntity } from '../../core/domain/facture.entity';
import { FactureEntity as FactureOrmEntity } from '../db/entities/facture.entity';
import { FactureMapper } from '../../applications/mapper/facture.mapper';

@Injectable()
export class TypeOrmFactureRepository implements FactureRepositoryPort {
  constructor(
    @InjectRepository(FactureOrmEntity)
    private readonly repository: Repository<FactureOrmEntity>,
  ) {}

  async findById(id: string): Promise<FactureDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? FactureMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<FactureDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => FactureMapper.toDomain(entity));
  }

  async create(entity: FactureDomainEntity): Promise<FactureDomainEntity> {
    const ormEntity = this.repository.create(
      FactureMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return FactureMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<FactureDomainEntity>,
  ): Promise<FactureDomainEntity> {
    await this.repository.update(
      id,
      FactureMapper.toPersistence(entity as FactureDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return FactureMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
