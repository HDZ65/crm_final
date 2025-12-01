import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UtilisateurRepositoryPort } from '../../core/port/utilisateur-repository.port';
import type { UtilisateurEntity as UtilisateurDomainEntity } from '../../core/domain/utilisateur.entity';
import { UtilisateurEntity as UtilisateurOrmEntity } from '../db/entities/utilisateur.entity';
import { UtilisateurMapper } from '../../applications/mapper/utilisateur.mapper';

@Injectable()
export class TypeOrmUtilisateurRepository implements UtilisateurRepositoryPort {
  constructor(
    @InjectRepository(UtilisateurOrmEntity)
    private readonly repository: Repository<UtilisateurOrmEntity>,
  ) {}

  async findById(id: string): Promise<UtilisateurDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? UtilisateurMapper.toDomain(entity) : null;
  }

  async findByKeycloakId(keycloakId: string): Promise<UtilisateurDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { keycloakId } });
    return entity ? UtilisateurMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<UtilisateurDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => UtilisateurMapper.toDomain(entity));
  }

  async create(
    entity: UtilisateurDomainEntity,
  ): Promise<UtilisateurDomainEntity> {
    const ormEntity = this.repository.create(
      UtilisateurMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return UtilisateurMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<UtilisateurDomainEntity>,
  ): Promise<UtilisateurDomainEntity> {
    await this.repository.update(
      id,
      UtilisateurMapper.toPersistence(entity as UtilisateurDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return UtilisateurMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
