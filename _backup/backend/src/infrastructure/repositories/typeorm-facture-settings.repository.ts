import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FactureSettingsEntity as DomainEntity } from '../../core/domain/facture-settings.entity';
import { FactureSettingsRepositoryPort } from '../../core/port/facture-settings-repository.port';
import { FactureSettingsEntity as OrmEntity } from '../db/entities/facture-settings.entity';
import { FactureSettingsMapper } from '../../applications/mapper/facture-settings.mapper';

@Injectable()
export class TypeOrmFactureSettingsRepository implements FactureSettingsRepositoryPort {
  constructor(
    @InjectRepository(OrmEntity)
    private readonly repository: Repository<OrmEntity>,
    private readonly mapper: FactureSettingsMapper,
  ) {}

  async findAll(): Promise<DomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findById(id: string): Promise<DomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findBySocieteId(societeId: string): Promise<DomainEntity | null> {
    const entity = await this.repository.findOne({ where: { societeId } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async create(domain: DomainEntity): Promise<DomainEntity> {
    const persistence = this.mapper.toPersistence(domain);
    const created = await this.repository.save(persistence);
    return this.mapper.toDomain(created as OrmEntity);
  }

  async update(id: string, domain: Partial<DomainEntity>): Promise<DomainEntity> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      throw new Error(`FactureSettings with id ${id} not found`);
    }

    const updated = await this.repository.save({
      ...existing,
      ...this.mapper.toPersistence(domain as DomainEntity),
      id, // Ensure ID isn't changed
    });
    return this.mapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      throw new Error(`FactureSettings with id ${id} not found`);
    }
    await this.repository.delete(id);
  }
}
