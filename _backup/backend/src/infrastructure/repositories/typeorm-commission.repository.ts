import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CommissionRepositoryPort,
  CommissionWithDetails,
} from '../../core/port/commission-repository.port';
import type { CommissionEntity as CommissionDomainEntity } from '../../core/domain/commission.entity';
import { CommissionEntity as CommissionOrmEntity } from '../db/entities/commission.entity';
import { CommissionMapper } from '../../applications/mapper/commission.mapper';

@Injectable()
export class TypeOrmCommissionRepository implements CommissionRepositoryPort {
  constructor(
    @InjectRepository(CommissionOrmEntity)
    private readonly repository: Repository<CommissionOrmEntity>,
  ) {}

  async findById(id: string): Promise<CommissionDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? CommissionMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<CommissionDomainEntity[]> {
    const entities = await this.repository.find({
      order: { dateCreation: 'DESC' },
    });
    return entities.map((entity) => CommissionMapper.toDomain(entity));
  }

  async findByOrganisationId(
    organisationId: string,
  ): Promise<CommissionDomainEntity[]> {
    const entities = await this.repository.find({
      where: { organisationId },
      order: { dateCreation: 'DESC' },
    });
    return entities.map((entity) => CommissionMapper.toDomain(entity));
  }

  async findByApporteurId(
    apporteurId: string,
  ): Promise<CommissionDomainEntity[]> {
    const entities = await this.repository.find({
      where: { apporteurId },
      order: { dateCreation: 'DESC' },
    });
    return entities.map((entity) => CommissionMapper.toDomain(entity));
  }

  async findByPeriode(periode: string): Promise<CommissionDomainEntity[]> {
    const entities = await this.repository.find({
      where: { periode },
      order: { dateCreation: 'DESC' },
    });
    return entities.map((entity) => CommissionMapper.toDomain(entity));
  }

  async findAllWithDetails(
    organisationId?: string,
  ): Promise<CommissionWithDetails[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('commission')
      .leftJoinAndSelect('commission.apporteur', 'apporteur')
      .leftJoinAndSelect('commission.contrat', 'contrat')
      .leftJoinAndSelect('contrat.client', 'client')
      .leftJoinAndSelect('commission.produit', 'produit')
      .leftJoinAndSelect('commission.statut', 'statut')
      .orderBy('commission.dateCreation', 'DESC');

    if (organisationId) {
      queryBuilder.where('commission.organisationId = :organisationId', {
        organisationId,
      });
    }

    const entities = await queryBuilder.getMany();

    return entities.map((entity) => ({
      commission: CommissionMapper.toDomain(entity),
      apporteur: entity.apporteur
        ? {
            id: entity.apporteur.id,
            nom: entity.apporteur.nom,
            prenom: entity.apporteur.prenom,
            typeApporteur: entity.apporteur.typeApporteur,
          }
        : null,
      contrat: entity.contrat
        ? {
            id: entity.contrat.id,
            referenceExterne: entity.contrat.reference,
            clientNom: entity.contrat.client
              ? `${entity.contrat.client.prenom} ${entity.contrat.client.nom}`
              : null,
          }
        : null,
      produit: entity.produit
        ? {
            id: entity.produit.id,
            nom: entity.produit.nom,
            sku: entity.produit.sku,
          }
        : null,
      statut: entity.statut
        ? {
            id: entity.statut.id,
            code: entity.statut.code,
            nom: entity.statut.nom,
          }
        : null,
    }));
  }

  async findByIdWithDetails(id: string): Promise<CommissionWithDetails | null> {
    const entity = await this.repository
      .createQueryBuilder('commission')
      .leftJoinAndSelect('commission.apporteur', 'apporteur')
      .leftJoinAndSelect('commission.contrat', 'contrat')
      .leftJoinAndSelect('contrat.client', 'client')
      .leftJoinAndSelect('commission.produit', 'produit')
      .leftJoinAndSelect('commission.statut', 'statut')
      .where('commission.id = :id', { id })
      .getOne();

    if (!entity) {
      return null;
    }

    return {
      commission: CommissionMapper.toDomain(entity),
      apporteur: entity.apporteur
        ? {
            id: entity.apporteur.id,
            nom: entity.apporteur.nom,
            prenom: entity.apporteur.prenom,
            typeApporteur: entity.apporteur.typeApporteur,
          }
        : null,
      contrat: entity.contrat
        ? {
            id: entity.contrat.id,
            referenceExterne: entity.contrat.reference,
            clientNom: entity.contrat.client
              ? `${entity.contrat.client.prenom} ${entity.contrat.client.nom}`
              : null,
          }
        : null,
      produit: entity.produit
        ? {
            id: entity.produit.id,
            nom: entity.produit.nom,
            sku: entity.produit.sku,
          }
        : null,
      statut: entity.statut
        ? {
            id: entity.statut.id,
            code: entity.statut.code,
            nom: entity.statut.nom,
          }
        : null,
    };
  }

  async create(
    entity: CommissionDomainEntity,
  ): Promise<CommissionDomainEntity> {
    const ormEntity = this.repository.create(
      CommissionMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return CommissionMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<CommissionDomainEntity>,
  ): Promise<CommissionDomainEntity> {
    await this.repository.update(
      id,
      CommissionMapper.toPersistence(entity as CommissionDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return CommissionMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
