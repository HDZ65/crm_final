import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ClientBaseRepositoryPort } from '../../core/port/client-base-repository.port';
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
}
