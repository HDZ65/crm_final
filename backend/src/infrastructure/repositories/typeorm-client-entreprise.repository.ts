import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ClientEntrepriseRepositoryPort } from '../../core/port/client-entreprise-repository.port';
import type { ClientEntrepriseEntity as ClientEntrepriseDomainEntity } from '../../core/domain/client-entreprise.entity';
import { ClientEntrepriseEntity as ClientEntrepriseOrmEntity } from '../db/entities/client-entreprise.entity';
import { ClientEntrepriseMapper } from '../../applications/mapper/client-entreprise.mapper';

@Injectable()
export class TypeOrmClientEntrepriseRepository
  implements ClientEntrepriseRepositoryPort
{
  constructor(
    @InjectRepository(ClientEntrepriseOrmEntity)
    private readonly repository: Repository<ClientEntrepriseOrmEntity>,
  ) {}

  async findById(id: string): Promise<ClientEntrepriseDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ClientEntrepriseMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ClientEntrepriseDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ClientEntrepriseMapper.toDomain(entity));
  }

  async create(
    entity: ClientEntrepriseDomainEntity,
  ): Promise<ClientEntrepriseDomainEntity> {
    const ormEntity = this.repository.create(
      ClientEntrepriseMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ClientEntrepriseMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ClientEntrepriseDomainEntity>,
  ): Promise<ClientEntrepriseDomainEntity> {
    await this.repository.update(
      id,
      ClientEntrepriseMapper.toPersistence(
        entity as ClientEntrepriseDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return ClientEntrepriseMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
