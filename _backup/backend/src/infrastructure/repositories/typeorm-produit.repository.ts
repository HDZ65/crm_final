import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ProduitRepositoryPort } from '../../core/port/produit-repository.port';
import type { ProduitEntity as ProduitDomainEntity } from '../../core/domain/produit.entity';
import { ProduitEntity as ProduitOrmEntity } from '../db/entities/produit.entity';
import { ProduitMapper } from '../../applications/mapper/produit.mapper';

@Injectable()
export class TypeOrmProduitRepository implements ProduitRepositoryPort {
  constructor(
    @InjectRepository(ProduitOrmEntity)
    private readonly repository: Repository<ProduitOrmEntity>,
  ) {}

  async findById(id: string): Promise<ProduitDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ProduitMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ProduitDomainEntity[]> {
    const entities = await this.repository.find({ order: { nom: 'ASC' } });
    return entities.map((entity) => ProduitMapper.toDomain(entity));
  }

  async findBySocieteId(societeId: string): Promise<ProduitDomainEntity[]> {
    const entities = await this.repository.find({
      where: { societeId },
      order: { nom: 'ASC' },
    });
    return entities.map((entity) => ProduitMapper.toDomain(entity));
  }

  async findByGammeId(gammeId: string): Promise<ProduitDomainEntity[]> {
    const entities = await this.repository.find({
      where: { gammeId },
      order: { nom: 'ASC' },
    });
    return entities.map((entity) => ProduitMapper.toDomain(entity));
  }

  async create(entity: ProduitDomainEntity): Promise<ProduitDomainEntity> {
    const ormEntity = this.repository.create(
      ProduitMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ProduitMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ProduitDomainEntity>,
  ): Promise<ProduitDomainEntity> {
    await this.repository.update(
      id,
      ProduitMapper.toPersistence(entity as ProduitDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ProduitMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
