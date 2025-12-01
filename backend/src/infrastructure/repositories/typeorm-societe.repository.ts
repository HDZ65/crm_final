import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SocieteRepositoryPort } from '../../core/port/societe-repository.port';
import type { SocieteEntity as SocieteDomainEntity } from '../../core/domain/societe.entity';
import { SocieteEntity as SocieteOrmEntity } from '../db/entities/societe.entity';
import { SocieteMapper } from '../../applications/mapper/societe.mapper';

@Injectable()
export class TypeOrmSocieteRepository implements SocieteRepositoryPort {
  constructor(
    @InjectRepository(SocieteOrmEntity)
    private readonly repository: Repository<SocieteOrmEntity>,
  ) {}

  async findById(id: string): Promise<SocieteDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? SocieteMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<SocieteDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => SocieteMapper.toDomain(entity));
  }

  async create(entity: SocieteDomainEntity): Promise<SocieteDomainEntity> {
    const ormEntity = this.repository.create(
      SocieteMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return SocieteMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<SocieteDomainEntity>,
  ): Promise<SocieteDomainEntity> {
    await this.repository.update(
      id,
      SocieteMapper.toPersistence(entity as SocieteDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return SocieteMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
