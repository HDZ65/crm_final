import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  ExpeditionRepositoryPort,
  ExpeditionWithDetails,
} from '../../core/port/expedition-repository.port';
import type { ExpeditionEntity as ExpeditionDomainEntity } from '../../core/domain/expedition.entity';
import { ExpeditionEntity as ExpeditionOrmEntity } from '../db/entities/expedition.entity';
import { ExpeditionMapper } from '../../applications/mapper/expedition.mapper';

@Injectable()
export class TypeOrmExpeditionRepository implements ExpeditionRepositoryPort {
  constructor(
    @InjectRepository(ExpeditionOrmEntity)
    private readonly repository: Repository<ExpeditionOrmEntity>,
  ) {}

  async findById(id: string): Promise<ExpeditionDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ExpeditionMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ExpeditionDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ExpeditionMapper.toDomain(entity));
  }

  async findAllWithDetails(
    organisationId?: string,
  ): Promise<ExpeditionWithDetails[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('expedition')
      .leftJoinAndSelect('expedition.clientBase', 'clientBase')
      .leftJoinAndSelect('expedition.contrat', 'contrat')
      .leftJoinAndSelect('expedition.transporteurCompte', 'transporteurCompte')
      .orderBy('expedition.dateCreation', 'DESC');

    if (organisationId) {
      queryBuilder.where('expedition.organisationId = :organisationId', {
        organisationId,
      });
    }

    const entities = await queryBuilder.getMany();

    return entities.map((entity) => ({
      expedition: ExpeditionMapper.toDomain(entity),
      client: entity.clientBase
        ? {
            id: entity.clientBase.id,
            nom: entity.clientBase.nom,
            prenom: entity.clientBase.prenom,
            entreprise: null,
            email: entity.clientBase.email || null,
          }
        : null,
      contrat: entity.contrat
        ? {
            id: entity.contrat.id,
            referenceExterne: entity.contrat.reference,
          }
        : null,
      transporteur: entity.transporteurCompte
        ? {
            id: entity.transporteurCompte.id,
            type: entity.transporteurCompte.type,
          }
        : null,
    }));
  }

  async findByIdWithDetails(id: string): Promise<ExpeditionWithDetails | null> {
    const entity = await this.repository
      .createQueryBuilder('expedition')
      .leftJoinAndSelect('expedition.clientBase', 'clientBase')
      .leftJoinAndSelect('expedition.contrat', 'contrat')
      .leftJoinAndSelect('expedition.transporteurCompte', 'transporteurCompte')
      .where('expedition.id = :id', { id })
      .getOne();

    if (!entity) {
      return null;
    }

    return {
      expedition: ExpeditionMapper.toDomain(entity),
      client: entity.clientBase
        ? {
            id: entity.clientBase.id,
            nom: entity.clientBase.nom,
            prenom: entity.clientBase.prenom,
            entreprise: null,
            email: entity.clientBase.email || null,
          }
        : null,
      contrat: entity.contrat
        ? {
            id: entity.contrat.id,
            referenceExterne: entity.contrat.reference,
          }
        : null,
      transporteur: entity.transporteurCompte
        ? {
            id: entity.transporteurCompte.id,
            type: entity.transporteurCompte.type,
          }
        : null,
    };
  }

  async create(
    entity: ExpeditionDomainEntity,
  ): Promise<ExpeditionDomainEntity> {
    const ormEntity = this.repository.create(
      ExpeditionMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ExpeditionMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ExpeditionDomainEntity>,
  ): Promise<ExpeditionDomainEntity> {
    await this.repository.update(
      id,
      ExpeditionMapper.toPersistence(entity as ExpeditionDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ExpeditionMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
