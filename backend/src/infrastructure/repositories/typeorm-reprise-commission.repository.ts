import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepriseCommissionEntity as RepriseCommissionOrmEntity } from '../db/entities/reprise-commission.entity';
import { RepriseCommissionEntity } from '../../core/domain/reprise-commission.entity';
import type { RepriseCommissionRepositoryPort } from '../../core/port/reprise-commission-repository.port';
import { RepriseCommissionMapper } from '../../applications/mapper/reprise-commission.mapper';

@Injectable()
export class TypeOrmRepriseCommissionRepository
  implements RepriseCommissionRepositoryPort
{
  constructor(
    @InjectRepository(RepriseCommissionOrmEntity)
    private readonly repository: Repository<RepriseCommissionOrmEntity>,
  ) {}

  async create(entity: RepriseCommissionEntity): Promise<RepriseCommissionEntity> {
    const ormEntity = this.repository.create(
      RepriseCommissionMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return RepriseCommissionMapper.toDomain(saved);
  }

  async findById(id: string): Promise<RepriseCommissionEntity | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? RepriseCommissionMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<RepriseCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(RepriseCommissionMapper.toDomain);
  }

  async update(
    id: string,
    entity: RepriseCommissionEntity,
  ): Promise<RepriseCommissionEntity> {
    await this.repository.update(id, RepriseCommissionMapper.toPersistence(entity));
    const updated = await this.repository.findOne({ where: { id } });
    return RepriseCommissionMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByOrganisationId(
    organisationId: string,
  ): Promise<RepriseCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { organisationId },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(RepriseCommissionMapper.toDomain);
  }

  async findByCommissionOriginaleId(
    commissionId: string,
  ): Promise<RepriseCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { commissionOriginaleId: commissionId },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(RepriseCommissionMapper.toDomain);
  }

  async findByApporteurId(
    apporteurId: string,
  ): Promise<RepriseCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { apporteurId },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(RepriseCommissionMapper.toDomain);
  }

  async findByContratId(contratId: string): Promise<RepriseCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { contratId },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(RepriseCommissionMapper.toDomain);
  }

  async findByPeriodeApplication(
    periode: string,
  ): Promise<RepriseCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { periodeApplication: periode },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(RepriseCommissionMapper.toDomain);
  }

  async findEnAttente(organisationId?: string): Promise<RepriseCommissionEntity[]> {
    const where: any = { statutReprise: 'en_attente' };
    if (organisationId) {
      where.organisationId = organisationId;
    }
    const ormEntities = await this.repository.find({
      where,
      order: { dateLimite: 'ASC' },
    });
    return ormEntities.map(RepriseCommissionMapper.toDomain);
  }

  async findByBordereauId(
    bordereauId: string,
  ): Promise<RepriseCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { bordereauId },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(RepriseCommissionMapper.toDomain);
  }

  async appliquerReprise(
    id: string,
    bordereauId: string,
  ): Promise<RepriseCommissionEntity> {
    await this.repository.update(id, {
      statutReprise: 'appliquee',
      bordereauId,
      dateApplication: new Date(),
      updatedAt: new Date(),
    });
    const updated = await this.repository.findOne({ where: { id } });
    return RepriseCommissionMapper.toDomain(updated!);
  }

  async annulerReprise(
    id: string,
    motif: string,
  ): Promise<RepriseCommissionEntity> {
    await this.repository.update(id, {
      statutReprise: 'annulee',
      motif,
      updatedAt: new Date(),
    });
    const updated = await this.repository.findOne({ where: { id } });
    return RepriseCommissionMapper.toDomain(updated!);
  }
}
