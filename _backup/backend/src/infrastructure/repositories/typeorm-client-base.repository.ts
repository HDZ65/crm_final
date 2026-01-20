import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  ClientBaseRepositoryPort,
  ClientBaseFilters,
  ClientBaseWithContrats,
} from '../../core/port/client-base-repository.port';
import type { ClientBaseEntity as ClientBaseDomainEntity } from '../../core/domain/client-base.entity';
import { ClientBaseEntity as ClientBaseOrmEntity } from '../db/entities/client-base.entity';
import { ClientBaseMapper } from '../../applications/mapper/client-base.mapper';

@Injectable()
export class TypeOrmClientBaseRepository implements ClientBaseRepositoryPort {
  constructor(
    @InjectRepository(ClientBaseOrmEntity)
    private readonly repository: Repository<ClientBaseOrmEntity>,
  ) {}

  async findById(id: string): Promise<ClientBaseDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ClientBaseMapper.toDomain(entity) : null;
  }

  async findByPhoneAndName(
    telephone: string,
    nom: string,
  ): Promise<ClientBaseDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { telephone, nom } });
    return entity ? ClientBaseMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ClientBaseDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ClientBaseMapper.toDomain(entity));
  }

  async create(
    entity: ClientBaseDomainEntity,
  ): Promise<ClientBaseDomainEntity> {
    const ormEntity = this.repository.create(
      ClientBaseMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ClientBaseMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ClientBaseDomainEntity>,
  ): Promise<ClientBaseDomainEntity> {
    await this.repository.update(
      id,
      ClientBaseMapper.toPersistence(entity as ClientBaseDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ClientBaseMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findAllWithContrats(
    filters?: ClientBaseFilters,
  ): Promise<ClientBaseWithContrats[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.contrats', 'contrat');

    if (filters?.organisationId) {
      queryBuilder.andWhere('client.organisationId = :organisationId', {
        organisationId: filters.organisationId,
      });
    }

    if (filters?.statutId) {
      queryBuilder.andWhere('client.statut = :statut', {
        statut: filters.statutId,
      });
    }

    if (filters?.societeId) {
      queryBuilder.andWhere('contrat.societeId = :societeId', {
        societeId: filters.societeId,
      });
    }

    const entities = await queryBuilder.getMany();

    return entities.map((entity) => {
      const domain = ClientBaseMapper.toDomain(entity);
      return {
        ...domain,
        contrats: (entity.contrats || []).map((c) => ({
          id: c.id,
          reference: c.reference,
          titre: c.titre,
          dateDebut: c.dateDebut,
          dateFin: c.dateFin,
          statut: c.statut,
          montant: c.montant ? Number(c.montant) : null,
        })),
      };
    });
  }

  async findByIdWithContrats(id: string): Promise<ClientBaseWithContrats | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['contrats'],
    });

    if (!entity) {
      return null;
    }

    const domain = ClientBaseMapper.toDomain(entity);
    return {
      ...domain,
      contrats: (entity.contrats || []).map((c) => ({
        id: c.id,
        reference: c.reference,
        titre: c.titre,
        dateDebut: c.dateDebut,
        dateFin: c.dateFin,
        statut: c.statut,
        montant: c.montant ? Number(c.montant) : null,
      })),
    };
  }
}
