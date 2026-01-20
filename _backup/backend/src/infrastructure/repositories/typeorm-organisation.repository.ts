import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { OrganisationRepositoryPort } from '../../core/port/organisation-repository.port';
import type { OrganisationEntity as OrganisationDomainEntity } from '../../core/domain/organisation.entity';
import { OrganisationEntity as OrganisationOrmEntity } from '../db/entities/organisation.entity';
import { OrganisationMapper } from '../../core/mapper/organisation.mapper';

@Injectable()
export class TypeOrmOrganisationRepository implements OrganisationRepositoryPort {
  constructor(
    @InjectRepository(OrganisationOrmEntity)
    private readonly repository: Repository<OrganisationOrmEntity>,
  ) {}

  async findById(id: string): Promise<OrganisationDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? OrganisationMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<OrganisationDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => OrganisationMapper.toDomain(entity));
  }

  async create(
    entity: OrganisationDomainEntity,
  ): Promise<OrganisationDomainEntity> {
    const ormEntity = this.repository.create(
      OrganisationMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return OrganisationMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<OrganisationDomainEntity>,
  ): Promise<OrganisationDomainEntity> {
    await this.repository.update(
      id,
      OrganisationMapper.toPersistence(entity as OrganisationDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return OrganisationMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
