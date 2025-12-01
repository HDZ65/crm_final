import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PrixProduitRepositoryPort } from '../../core/port/prix-produit-repository.port';
import type { PrixProduitEntity as PrixProduitDomainEntity } from '../../core/domain/prix-produit.entity';
import { PrixProduitEntity as PrixProduitOrmEntity } from '../db/entities/prix-produit.entity';
import { PrixProduitMapper } from '../../applications/mapper/prix-produit.mapper';

@Injectable()
export class TypeOrmPrixProduitRepository implements PrixProduitRepositoryPort {
  constructor(
    @InjectRepository(PrixProduitOrmEntity)
    private readonly repository: Repository<PrixProduitOrmEntity>,
  ) {}

  async findById(id: string): Promise<PrixProduitDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? PrixProduitMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<PrixProduitDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => PrixProduitMapper.toDomain(entity));
  }

  async create(
    entity: PrixProduitDomainEntity,
  ): Promise<PrixProduitDomainEntity> {
    const ormEntity = this.repository.create(
      PrixProduitMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return PrixProduitMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<PrixProduitDomainEntity>,
  ): Promise<PrixProduitDomainEntity> {
    await this.repository.update(
      id,
      PrixProduitMapper.toPersistence(entity as PrixProduitDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return PrixProduitMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
