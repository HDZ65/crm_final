import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, MoreThanOrEqual, In } from 'typeorm';
import type { TacheRepositoryPort } from '../../core/port/tache-repository.port';
import type { TacheEntity as TacheDomainEntity, TacheStatut, TacheType } from '../../core/domain/tache.entity';
import { TacheEntity as TacheOrmEntity } from '../db/entities/tache.entity';
import { TacheMapper } from '../../applications/mapper/tache.mapper';

@Injectable()
export class TypeOrmTacheRepository implements TacheRepositoryPort {
  constructor(
    @InjectRepository(TacheOrmEntity)
    private readonly repository: Repository<TacheOrmEntity>,
  ) {}

  async findById(id: string): Promise<TacheDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? TacheMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<TacheDomainEntity[]> {
    const entities = await this.repository.find({
      order: { dateEcheance: 'ASC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async findByOrganisationId(organisationId: string): Promise<TacheDomainEntity[]> {
    const entities = await this.repository.find({
      where: { organisationId },
      order: { dateEcheance: 'ASC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async findByAssigneA(assigneA: string): Promise<TacheDomainEntity[]> {
    const entities = await this.repository.find({
      where: { assigneA },
      order: { dateEcheance: 'ASC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async findByClientId(clientId: string): Promise<TacheDomainEntity[]> {
    const entities = await this.repository.find({
      where: { clientId },
      order: { dateEcheance: 'ASC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async findByContratId(contratId: string): Promise<TacheDomainEntity[]> {
    const entities = await this.repository.find({
      where: { contratId },
      order: { dateEcheance: 'ASC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async findByFactureId(factureId: string): Promise<TacheDomainEntity[]> {
    const entities = await this.repository.find({
      where: { factureId },
      order: { dateEcheance: 'ASC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async findByStatut(organisationId: string, statut: TacheStatut): Promise<TacheDomainEntity[]> {
    const entities = await this.repository.find({
      where: { organisationId, statut },
      order: { dateEcheance: 'ASC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async findByType(organisationId: string, type: TacheType): Promise<TacheDomainEntity[]> {
    const entities = await this.repository.find({
      where: { organisationId, type },
      order: { dateEcheance: 'ASC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async findEnRetard(organisationId: string): Promise<TacheDomainEntity[]> {
    const now = new Date();
    const entities = await this.repository.find({
      where: {
        organisationId,
        statut: In(['A_FAIRE', 'EN_COURS']),
        dateEcheance: LessThan(now),
      },
      order: { dateEcheance: 'ASC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async findDuJour(assigneA: string): Promise<TacheDomainEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entities = await this.repository.find({
      where: {
        assigneA,
        statut: In(['A_FAIRE', 'EN_COURS']),
        dateEcheance: Between(today, tomorrow),
      },
      order: { dateEcheance: 'ASC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async findASemaine(assigneA: string): Promise<TacheDomainEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const entities = await this.repository.find({
      where: {
        assigneA,
        statut: In(['A_FAIRE', 'EN_COURS']),
        dateEcheance: Between(today, nextWeek),
      },
      order: { dateEcheance: 'ASC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async countByStatut(organisationId: string): Promise<Record<TacheStatut, number>> {
    const result = await this.repository
      .createQueryBuilder('tache')
      .select('tache.statut', 'statut')
      .addSelect('COUNT(*)', 'count')
      .where('tache.organisationId = :organisationId', { organisationId })
      .groupBy('tache.statut')
      .getRawMany();

    const counts: Record<TacheStatut, number> = {
      A_FAIRE: 0,
      EN_COURS: 0,
      TERMINEE: 0,
      ANNULEE: 0,
    };

    for (const row of result) {
      counts[row.statut as TacheStatut] = parseInt(row.count, 10);
    }

    return counts;
  }

  async countEnRetard(organisationId: string): Promise<number> {
    const now = new Date();
    return await this.repository.count({
      where: {
        organisationId,
        statut: In(['A_FAIRE', 'EN_COURS']),
        dateEcheance: LessThan(now),
      },
    });
  }

  async findByRegleRelanceId(regleRelanceId: string): Promise<TacheDomainEntity[]> {
    const entities = await this.repository.find({
      where: { regleRelanceId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => TacheMapper.toDomain(entity));
  }

  async create(entity: TacheDomainEntity): Promise<TacheDomainEntity> {
    const ormEntity = this.repository.create(TacheMapper.toPersistence(entity));
    const saved = await this.repository.save(ormEntity);
    return TacheMapper.toDomain(saved);
  }

  async update(id: string, entity: Partial<TacheDomainEntity>): Promise<TacheDomainEntity> {
    await this.repository.update(id, TacheMapper.toPersistence(entity as TacheDomainEntity));
    const updated = await this.repository.findOne({ where: { id } });
    return TacheMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
