import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { MembreCompteRepositoryPort } from '../../core/port/membre-compte-repository.port';
import type { MembreCompteEntity as MembreCompteDomainEntity } from '../../core/domain/membre-compte.entity';
import { MembreOrganisationEntity } from '../db/entities/membre-compte.entity';
import { MembreCompteMapper } from '../../applications/mapper/membre-compte.mapper';

@Injectable()
export class TypeOrmMembreCompteRepository implements MembreCompteRepositoryPort {
  constructor(
    @InjectRepository(MembreOrganisationEntity)
    private readonly repository: Repository<MembreOrganisationEntity>,
  ) {}

  async findById(id: string): Promise<MembreCompteDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? MembreCompteMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<MembreCompteDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => MembreCompteMapper.toDomain(entity));
  }

  async findByOrganisationId(
    organisationId: string,
  ): Promise<MembreCompteDomainEntity[]> {
    const entities = await this.repository.find({
      where: { organisationId },
      relations: ['utilisateur'],
    });
    return entities.map((entity) => MembreCompteMapper.toDomain(entity));
  }

  async create(
    entity: MembreCompteDomainEntity,
  ): Promise<MembreCompteDomainEntity> {
    const ormEntity = this.repository.create(
      MembreCompteMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return MembreCompteMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<MembreCompteDomainEntity>,
  ): Promise<MembreCompteDomainEntity> {
    await this.repository.update(
      id,
      MembreCompteMapper.toPersistence(entity as MembreCompteDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return MembreCompteMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
