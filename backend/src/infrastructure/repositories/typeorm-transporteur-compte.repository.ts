import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TransporteurCompteRepositoryPort } from '../../core/port/transporteur-compte-repository.port';
import type { TransporteurCompteEntity as TransporteurCompteDomainEntity } from '../../core/domain/transporteur-compte.entity';
import { TransporteurCompteEntity as TransporteurCompteOrmEntity } from '../db/entities/transporteur-compte.entity';
import { TransporteurCompteMapper } from '../../applications/mapper/transporteur-compte.mapper';

@Injectable()
export class TypeOrmTransporteurCompteRepository
  implements TransporteurCompteRepositoryPort
{
  constructor(
    @InjectRepository(TransporteurCompteOrmEntity)
    private readonly repository: Repository<TransporteurCompteOrmEntity>,
  ) {}

  async findById(id: string): Promise<TransporteurCompteDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? TransporteurCompteMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<TransporteurCompteDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => TransporteurCompteMapper.toDomain(entity));
  }

  async create(
    entity: TransporteurCompteDomainEntity,
  ): Promise<TransporteurCompteDomainEntity> {
    const ormEntity = this.repository.create(
      TransporteurCompteMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return TransporteurCompteMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<TransporteurCompteDomainEntity>,
  ): Promise<TransporteurCompteDomainEntity> {
    await this.repository.update(
      id,
      TransporteurCompteMapper.toPersistence(
        entity as TransporteurCompteDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return TransporteurCompteMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
