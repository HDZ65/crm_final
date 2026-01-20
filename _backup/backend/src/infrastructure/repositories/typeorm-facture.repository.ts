import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  FindOptionsWhere,
} from 'typeorm';
import type {
  FactureRepositoryPort,
  FactureFilters,
} from '../../core/port/facture-repository.port';
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

  async findByIdWithRelations(id: string): Promise<FactureDomainEntity | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['client', 'statut'],
    });
    return entity ? FactureMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<FactureDomainEntity[]> {
    const entities = await this.repository.find({
      relations: ['client', 'statut'],
    });
    return entities.map((entity) => FactureMapper.toDomain(entity));
  }

  async findAllWithFilters(
    filters: FactureFilters,
  ): Promise<FactureDomainEntity[]> {
    const where: FindOptionsWhere<FactureOrmEntity> = {};

    if (filters.organisationId) {
      where.organisationId = filters.organisationId;
    }

    if (filters.clientBaseId) {
      where.clientBaseId = filters.clientBaseId;
    }

    if (filters.statutId) {
      where.statutId = filters.statutId;
    }

    // Gestion des filtres de date
    if (filters.dateDebut && filters.dateFin) {
      where.dateEmission = Between(filters.dateDebut, filters.dateFin);
    } else if (filters.dateDebut) {
      where.dateEmission = MoreThanOrEqual(filters.dateDebut);
    } else if (filters.dateFin) {
      where.dateEmission = LessThanOrEqual(filters.dateFin);
    }

    const entities = await this.repository.find({
      where,
      relations: ['client', 'statut'],
      order: { dateEmission: 'DESC' },
    });

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
    const updated = await this.repository.findOne({
      where: { id },
      relations: ['client', 'statut'],
    });
    return FactureMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
