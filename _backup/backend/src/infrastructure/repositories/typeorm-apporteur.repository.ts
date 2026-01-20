import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ApporteurRepositoryPort } from '../../core/port/apporteur-repository.port';
import type { ApporteurEntity as ApporteurDomainEntity } from '../../core/domain/apporteur.entity';
import { ApporteurEntity as ApporteurOrmEntity } from '../db/entities/apporteur.entity';
import { ApporteurMapper } from '../../applications/mapper/apporteur.mapper';

@Injectable()
export class TypeOrmApporteurRepository implements ApporteurRepositoryPort {
  constructor(
    @InjectRepository(ApporteurOrmEntity)
    private readonly repository: Repository<ApporteurOrmEntity>,
  ) {}

  async findById(id: string): Promise<ApporteurDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ApporteurMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ApporteurDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ApporteurMapper.toDomain(entity));
  }

  async findByOrganisationId(
    organisationId: string,
  ): Promise<ApporteurDomainEntity[]> {
    const entities = await this.repository.find({ where: { organisationId } });
    return entities.map((entity) => ApporteurMapper.toDomain(entity));
  }

  async findByUtilisateurId(
    utilisateurId: string,
  ): Promise<ApporteurDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { utilisateurId } });
    return entity ? ApporteurMapper.toDomain(entity) : null;
  }

  async create(entity: ApporteurDomainEntity): Promise<ApporteurDomainEntity> {
    const ormEntity = this.repository.create(
      ApporteurMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ApporteurMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ApporteurDomainEntity>,
  ): Promise<ApporteurDomainEntity> {
    await this.repository.update(
      id,
      ApporteurMapper.toPersistence(entity as ApporteurDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ApporteurMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
