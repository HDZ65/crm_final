import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ClientPartenaireRepositoryPort } from '../../core/port/client-partenaire-repository.port';
import type { ClientPartenaireEntity as ClientPartenaireDomainEntity } from '../../core/domain/client-partenaire.entity';
import { ClientPartenaireEntity as ClientPartenaireOrmEntity } from '../db/entities/client-partenaire.entity';
import { ClientPartenaireMapper } from '../../applications/mapper/client-partenaire.mapper';

@Injectable()
export class TypeOrmClientPartenaireRepository
  implements ClientPartenaireRepositoryPort
{
  constructor(
    @InjectRepository(ClientPartenaireOrmEntity)
    private readonly repository: Repository<ClientPartenaireOrmEntity>,
  ) {}

  async findById(id: string): Promise<ClientPartenaireDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ClientPartenaireMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ClientPartenaireDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ClientPartenaireMapper.toDomain(entity));
  }

  async create(
    entity: ClientPartenaireDomainEntity,
  ): Promise<ClientPartenaireDomainEntity> {
    const ormEntity = this.repository.create(
      ClientPartenaireMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ClientPartenaireMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ClientPartenaireDomainEntity>,
  ): Promise<ClientPartenaireDomainEntity> {
    await this.repository.update(
      id,
      ClientPartenaireMapper.toPersistence(
        entity as ClientPartenaireDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ClientPartenaireMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
