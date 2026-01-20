import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { HistoriqueStatutContratRepositoryPort } from '../../core/port/historique-statut-contrat-repository.port';
import type { HistoriqueStatutContratEntity as HistoriqueStatutContratDomainEntity } from '../../core/domain/historique-statut-contrat.entity';
import { HistoriqueStatutContratEntity as HistoriqueStatutContratOrmEntity } from '../db/entities/historique-statut-contrat.entity';
import { HistoriqueStatutContratMapper } from '../../applications/mapper/historique-statut-contrat.mapper';

@Injectable()
export class TypeOrmHistoriqueStatutContratRepository implements HistoriqueStatutContratRepositoryPort {
  constructor(
    @InjectRepository(HistoriqueStatutContratOrmEntity)
    private readonly repository: Repository<HistoriqueStatutContratOrmEntity>,
  ) {}

  async findById(
    id: string,
  ): Promise<HistoriqueStatutContratDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? HistoriqueStatutContratMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<HistoriqueStatutContratDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) =>
      HistoriqueStatutContratMapper.toDomain(entity),
    );
  }

  async create(
    entity: HistoriqueStatutContratDomainEntity,
  ): Promise<HistoriqueStatutContratDomainEntity> {
    const ormEntity = this.repository.create(
      HistoriqueStatutContratMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return HistoriqueStatutContratMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<HistoriqueStatutContratDomainEntity>,
  ): Promise<HistoriqueStatutContratDomainEntity> {
    await this.repository.update(
      id,
      HistoriqueStatutContratMapper.toPersistence(
        entity as HistoriqueStatutContratDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return HistoriqueStatutContratMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
