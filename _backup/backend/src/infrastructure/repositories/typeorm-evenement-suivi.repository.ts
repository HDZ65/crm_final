import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { EvenementSuiviRepositoryPort } from '../../core/port/evenement-suivi-repository.port';
import type { EvenementSuiviEntity as EvenementSuiviDomainEntity } from '../../core/domain/evenement-suivi.entity';
import { EvenementSuiviEntity as EvenementSuiviOrmEntity } from '../db/entities/evenement-suivi.entity';
import { EvenementSuiviMapper } from '../../applications/mapper/evenement-suivi.mapper';

@Injectable()
export class TypeOrmEvenementSuiviRepository implements EvenementSuiviRepositoryPort {
  constructor(
    @InjectRepository(EvenementSuiviOrmEntity)
    private readonly repository: Repository<EvenementSuiviOrmEntity>,
  ) {}

  async findById(id: string): Promise<EvenementSuiviDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? EvenementSuiviMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<EvenementSuiviDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => EvenementSuiviMapper.toDomain(entity));
  }

  async create(
    entity: EvenementSuiviDomainEntity,
  ): Promise<EvenementSuiviDomainEntity> {
    const ormEntity = this.repository.create(
      EvenementSuiviMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return EvenementSuiviMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<EvenementSuiviDomainEntity>,
  ): Promise<EvenementSuiviDomainEntity> {
    await this.repository.update(
      id,
      EvenementSuiviMapper.toPersistence(entity as EvenementSuiviDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return EvenementSuiviMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
