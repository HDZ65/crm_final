import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import type { HistoriqueRelanceRepositoryPort } from '../../core/port/historique-relance-repository.port';
import type { HistoriqueRelanceEntity as HistoriqueRelanceDomainEntity } from '../../core/domain/historique-relance.entity';
import { HistoriqueRelanceEntity as HistoriqueRelanceOrmEntity } from '../db/entities/historique-relance.entity';
import { HistoriqueRelanceMapper } from '../../applications/mapper/historique-relance.mapper';

@Injectable()
export class TypeOrmHistoriqueRelanceRepository implements HistoriqueRelanceRepositoryPort {
  constructor(
    @InjectRepository(HistoriqueRelanceOrmEntity)
    private readonly repository: Repository<HistoriqueRelanceOrmEntity>,
  ) {}

  async findById(id: string): Promise<HistoriqueRelanceDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? HistoriqueRelanceMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<HistoriqueRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      order: { dateExecution: 'DESC' },
    });
    return entities.map((entity) => HistoriqueRelanceMapper.toDomain(entity));
  }

  async findByOrganisationId(
    organisationId: string,
  ): Promise<HistoriqueRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      where: { organisationId },
      order: { dateExecution: 'DESC' },
    });
    return entities.map((entity) => HistoriqueRelanceMapper.toDomain(entity));
  }

  async findByRegleRelanceId(
    regleRelanceId: string,
  ): Promise<HistoriqueRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      where: { regleRelanceId },
      order: { dateExecution: 'DESC' },
    });
    return entities.map((entity) => HistoriqueRelanceMapper.toDomain(entity));
  }

  async findByClientId(
    clientId: string,
  ): Promise<HistoriqueRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      where: { clientId },
      order: { dateExecution: 'DESC' },
    });
    return entities.map((entity) => HistoriqueRelanceMapper.toDomain(entity));
  }

  async findByContratId(
    contratId: string,
  ): Promise<HistoriqueRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      where: { contratId },
      order: { dateExecution: 'DESC' },
    });
    return entities.map((entity) => HistoriqueRelanceMapper.toDomain(entity));
  }

  async findByFactureId(
    factureId: string,
  ): Promise<HistoriqueRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      where: { factureId },
      order: { dateExecution: 'DESC' },
    });
    return entities.map((entity) => HistoriqueRelanceMapper.toDomain(entity));
  }

  async findRecent(
    organisationId: string,
    limit: number,
  ): Promise<HistoriqueRelanceDomainEntity[]> {
    const entities = await this.repository.find({
      where: { organisationId },
      order: { dateExecution: 'DESC' },
      take: limit,
    });
    return entities.map((entity) => HistoriqueRelanceMapper.toDomain(entity));
  }

  async existsForToday(
    regleRelanceId: string,
    clientId?: string,
    contratId?: string,
    factureId?: string,
  ): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClause: any = {
      regleRelanceId,
      dateExecution: Between(today, tomorrow),
    };

    if (clientId) whereClause.clientId = clientId;
    if (contratId) whereClause.contratId = contratId;
    if (factureId) whereClause.factureId = factureId;

    const count = await this.repository.count({ where: whereClause });
    return count > 0;
  }

  async create(
    entity: HistoriqueRelanceDomainEntity,
  ): Promise<HistoriqueRelanceDomainEntity> {
    const ormEntity = this.repository.create(
      HistoriqueRelanceMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return HistoriqueRelanceMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<HistoriqueRelanceDomainEntity>,
  ): Promise<HistoriqueRelanceDomainEntity> {
    await this.repository.update(
      id,
      HistoriqueRelanceMapper.toPersistence(
        entity as HistoriqueRelanceDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return HistoriqueRelanceMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
