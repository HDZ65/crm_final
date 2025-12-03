import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RegleRelanceRepositoryPort } from '../../core/port/regle-relance-repository.port';
import type { RegleRelanceEntity as RegleRelanceDomainEntity, RelanceDeclencheur } from '../../core/domain/regle-relance.entity';
import { RegleRelanceEntity as RegleRelanceOrmEntity } from '../db/entities/regle-relance.entity';
import { RegleRelanceMapper } from '../../applications/mapper/regle-relance.mapper';

@Injectable()
export class TypeOrmRegleRelanceRepository implements RegleRelanceRepositoryPort {
  constructor(
    @InjectRepository(RegleRelanceOrmEntity)
    private readonly repository: Repository<RegleRelanceOrmEntity>,
  ) {}

  async findById(id: string): Promise<RegleRelanceDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? RegleRelanceMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<RegleRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      order: { ordre: 'ASC', createdAt: 'ASC' },
    });
    return entities.map((entity) => RegleRelanceMapper.toDomain(entity));
  }

  async findByOrganisationId(organisationId: string): Promise<RegleRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      where: { organisationId },
      order: { ordre: 'ASC', createdAt: 'ASC' },
    });
    return entities.map((entity) => RegleRelanceMapper.toDomain(entity));
  }

  async findActives(organisationId: string): Promise<RegleRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      where: { organisationId, actif: true },
      order: { ordre: 'ASC', createdAt: 'ASC' },
    });
    return entities.map((entity) => RegleRelanceMapper.toDomain(entity));
  }

  async findByDeclencheur(organisationId: string, declencheur: RelanceDeclencheur): Promise<RegleRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      where: { organisationId, declencheur },
      order: { ordre: 'ASC', createdAt: 'ASC' },
    });
    return entities.map((entity) => RegleRelanceMapper.toDomain(entity));
  }

  async findActivesByDeclencheur(organisationId: string, declencheur: RelanceDeclencheur): Promise<RegleRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      where: { organisationId, declencheur, actif: true },
      order: { ordre: 'ASC', createdAt: 'ASC' },
    });
    return entities.map((entity) => RegleRelanceMapper.toDomain(entity));
  }

  async create(entity: RegleRelanceDomainEntity): Promise<RegleRelanceDomainEntity> {
    const ormEntity = this.repository.create(RegleRelanceMapper.toPersistence(entity));
    const saved = await this.repository.save(ormEntity);
    return RegleRelanceMapper.toDomain(saved);
  }

  async update(id: string, entity: Partial<RegleRelanceDomainEntity>): Promise<RegleRelanceDomainEntity> {
    await this.repository.update(id, RegleRelanceMapper.toPersistence(entity as RegleRelanceDomainEntity));
    const updated = await this.repository.findOne({ where: { id } });
    return RegleRelanceMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
