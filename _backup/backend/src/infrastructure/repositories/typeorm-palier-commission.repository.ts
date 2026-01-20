import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { PalierCommissionEntity as PalierCommissionOrmEntity } from '../db/entities/palier-commission.entity';
import { PalierCommissionEntity } from '../../core/domain/palier-commission.entity';
import type { PalierCommissionRepositoryPort } from '../../core/port/palier-commission-repository.port';
import { PalierCommissionMapper } from '../../applications/mapper/palier-commission.mapper';

@Injectable()
export class TypeOrmPalierCommissionRepository implements PalierCommissionRepositoryPort {
  constructor(
    @InjectRepository(PalierCommissionOrmEntity)
    private readonly repository: Repository<PalierCommissionOrmEntity>,
  ) {}

  async create(
    entity: PalierCommissionEntity,
  ): Promise<PalierCommissionEntity> {
    const ormEntity = this.repository.create(
      PalierCommissionMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return PalierCommissionMapper.toDomain(saved);
  }

  async findById(id: string): Promise<PalierCommissionEntity | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? PalierCommissionMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<PalierCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      order: { baremeId: 'ASC', ordre: 'ASC' },
    });
    return ormEntities.map(PalierCommissionMapper.toDomain);
  }

  async update(
    id: string,
    entity: PalierCommissionEntity,
  ): Promise<PalierCommissionEntity> {
    await this.repository.update(
      id,
      PalierCommissionMapper.toPersistence(entity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return PalierCommissionMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByOrganisationId(
    organisationId: string,
  ): Promise<PalierCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { organisationId },
      order: { baremeId: 'ASC', ordre: 'ASC' },
    });
    return ormEntities.map(PalierCommissionMapper.toDomain);
  }

  async findByBaremeId(baremeId: string): Promise<PalierCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { baremeId },
      order: { ordre: 'ASC' },
    });
    return ormEntities.map(PalierCommissionMapper.toDomain);
  }

  async findActifsByBaremeId(
    baremeId: string,
  ): Promise<PalierCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { baremeId, actif: true },
      order: { ordre: 'ASC' },
    });
    return ormEntities.map(PalierCommissionMapper.toDomain);
  }

  async findByTypeProduit(
    typeProduit: string,
  ): Promise<PalierCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { typeProduit, actif: true },
      order: { ordre: 'ASC' },
    });
    return ormEntities.map(PalierCommissionMapper.toDomain);
  }

  async findPalierApplicable(
    baremeId: string,
    typePalier: string,
    valeur: number,
  ): Promise<PalierCommissionEntity | null> {
    const ormEntity = await this.repository
      .createQueryBuilder('p')
      .where('p.bareme_id = :baremeId', { baremeId })
      .andWhere('p.type_palier = :typePalier', { typePalier })
      .andWhere('p.actif = :actif', { actif: true })
      .andWhere('p.seuil_min <= :valeur', { valeur })
      .andWhere('(p.seuil_max IS NULL OR p.seuil_max >= :valeur)', { valeur })
      .orderBy('p.seuil_min', 'DESC')
      .getOne();

    return ormEntity ? PalierCommissionMapper.toDomain(ormEntity) : null;
  }
}
