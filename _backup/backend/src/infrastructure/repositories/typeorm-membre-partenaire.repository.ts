import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { MembrePartenaireRepositoryPort } from '../../core/port/membre-partenaire-repository.port';
import type { MembrePartenaireEntity as MembrePartenaireDomainEntity } from '../../core/domain/membre-partenaire.entity';
import { MembrePartenaireEntity as MembrePartenaireOrmEntity } from '../db/entities/membre-partenaire.entity';
import { MembrePartenaireMapper } from '../../applications/mapper/membre-partenaire.mapper';

@Injectable()
export class TypeOrmMembrePartenaireRepository implements MembrePartenaireRepositoryPort {
  constructor(
    @InjectRepository(MembrePartenaireOrmEntity)
    private readonly repository: Repository<MembrePartenaireOrmEntity>,
  ) {}

  async findById(id: string): Promise<MembrePartenaireDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? MembrePartenaireMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<MembrePartenaireDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => MembrePartenaireMapper.toDomain(entity));
  }

  async create(
    entity: MembrePartenaireDomainEntity,
  ): Promise<MembrePartenaireDomainEntity> {
    const ormEntity = this.repository.create(
      MembrePartenaireMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return MembrePartenaireMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<MembrePartenaireDomainEntity>,
  ): Promise<MembrePartenaireDomainEntity> {
    await this.repository.update(
      id,
      MembrePartenaireMapper.toPersistence(
        entity as MembrePartenaireDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return MembrePartenaireMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
