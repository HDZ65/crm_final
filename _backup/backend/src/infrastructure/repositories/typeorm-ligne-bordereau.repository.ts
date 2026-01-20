import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LigneBordereauEntity as LigneBordereauOrmEntity } from '../db/entities/ligne-bordereau.entity';
import { LigneBordereauEntity } from '../../core/domain/ligne-bordereau.entity';
import type { LigneBordereauRepositoryPort } from '../../core/port/ligne-bordereau-repository.port';
import { LigneBordereauMapper } from '../../applications/mapper/ligne-bordereau.mapper';

@Injectable()
export class TypeOrmLigneBordereauRepository implements LigneBordereauRepositoryPort {
  constructor(
    @InjectRepository(LigneBordereauOrmEntity)
    private readonly repository: Repository<LigneBordereauOrmEntity>,
  ) {}

  async create(entity: LigneBordereauEntity): Promise<LigneBordereauEntity> {
    const ormEntity = this.repository.create(
      LigneBordereauMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return LigneBordereauMapper.toDomain(saved);
  }

  async findById(id: string): Promise<LigneBordereauEntity | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? LigneBordereauMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<LigneBordereauEntity[]> {
    const ormEntities = await this.repository.find({ order: { ordre: 'ASC' } });
    return ormEntities.map(LigneBordereauMapper.toDomain);
  }

  async update(
    id: string,
    entity: LigneBordereauEntity,
  ): Promise<LigneBordereauEntity> {
    await this.repository.update(
      id,
      LigneBordereauMapper.toPersistence(entity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return LigneBordereauMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByOrganisationId(
    organisationId: string,
  ): Promise<LigneBordereauEntity[]> {
    const ormEntities = await this.repository.find({
      where: { organisationId },
      order: { ordre: 'ASC' },
    });
    return ormEntities.map(LigneBordereauMapper.toDomain);
  }

  async findByBordereauId(
    bordereauId: string,
  ): Promise<LigneBordereauEntity[]> {
    const ormEntities = await this.repository.find({
      where: { bordereauId },
      order: { ordre: 'ASC' },
    });
    return ormEntities.map(LigneBordereauMapper.toDomain);
  }

  async findSelectionneesByBordereauId(
    bordereauId: string,
  ): Promise<LigneBordereauEntity[]> {
    const ormEntities = await this.repository.find({
      where: { bordereauId, selectionne: true },
      order: { ordre: 'ASC' },
    });
    return ormEntities.map(LigneBordereauMapper.toDomain);
  }

  async findByCommissionId(
    commissionId: string,
  ): Promise<LigneBordereauEntity[]> {
    const ormEntities = await this.repository.find({
      where: { commissionId },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(LigneBordereauMapper.toDomain);
  }

  async findByContratId(contratId: string): Promise<LigneBordereauEntity[]> {
    const ormEntities = await this.repository.find({
      where: { contratId },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(LigneBordereauMapper.toDomain);
  }

  async selectionnerLigne(id: string): Promise<LigneBordereauEntity> {
    await this.repository.update(id, {
      selectionne: true,
      statutLigne: 'selectionnee',
      motifDeselection: null,
      updatedAt: new Date(),
    });
    const updated = await this.repository.findOne({ where: { id } });
    return LigneBordereauMapper.toDomain(updated!);
  }

  async deselectionnerLigne(
    id: string,
    motif: string,
    validateurId: string,
  ): Promise<LigneBordereauEntity> {
    await this.repository.update(id, {
      selectionne: false,
      statutLigne: 'deselectionnee',
      motifDeselection: motif,
      validateurId,
      updatedAt: new Date(),
    });
    const updated = await this.repository.findOne({ where: { id } });
    return LigneBordereauMapper.toDomain(updated!);
  }

  async validerLigne(
    id: string,
    validateurId: string,
  ): Promise<LigneBordereauEntity> {
    await this.repository.update(id, {
      statutLigne: 'validee',
      validateurId,
      dateValidation: new Date(),
      updatedAt: new Date(),
    });
    const updated = await this.repository.findOne({ where: { id } });
    return LigneBordereauMapper.toDomain(updated!);
  }

  async deleteByBordereauId(bordereauId: string): Promise<void> {
    await this.repository.delete({ bordereauId });
  }
}
