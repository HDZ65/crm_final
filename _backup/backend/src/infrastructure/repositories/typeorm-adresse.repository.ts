import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AdresseRepositoryPort } from '../../core/port/adresse-repository.port';
import type { AdresseEntity as AdresseDomainEntity } from '../../core/domain/adresse.entity';
import { AdresseEntity as AdresseOrmEntity } from '../db/entities/adresse.entity';
import { AdresseMapper } from '../../applications/mapper/adresse.mapper';

@Injectable()
export class TypeOrmAdresseRepository implements AdresseRepositoryPort {
  constructor(
    @InjectRepository(AdresseOrmEntity)
    private readonly repository: Repository<AdresseOrmEntity>,
  ) {}

  async findById(id: string): Promise<AdresseDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? AdresseMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<AdresseDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => AdresseMapper.toDomain(entity));
  }

  async create(entity: AdresseDomainEntity): Promise<AdresseDomainEntity> {
    const ormEntity = this.repository.create(
      AdresseMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return AdresseMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<AdresseDomainEntity>,
  ): Promise<AdresseDomainEntity> {
    await this.repository.update(
      id,
      AdresseMapper.toPersistence(entity as AdresseDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return AdresseMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
