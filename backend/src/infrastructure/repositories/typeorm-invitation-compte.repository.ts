import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { InvitationCompteRepositoryPort } from '../../core/port/invitation-compte-repository.port';
import type { InvitationCompteEntity as InvitationCompteDomainEntity } from '../../core/domain/invitation-compte.entity';
import { InvitationCompteEntity as InvitationCompteOrmEntity } from '../db/entities/invitation-compte.entity';
import { InvitationCompteMapper } from '../../applications/mapper/invitation-compte.mapper';

@Injectable()
export class TypeOrmInvitationCompteRepository
  implements InvitationCompteRepositoryPort
{
  constructor(
    @InjectRepository(InvitationCompteOrmEntity)
    private readonly repository: Repository<InvitationCompteOrmEntity>,
  ) {}

  async findById(id: string): Promise<InvitationCompteDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? InvitationCompteMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<InvitationCompteDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => InvitationCompteMapper.toDomain(entity));
  }

  async create(
    entity: InvitationCompteDomainEntity,
  ): Promise<InvitationCompteDomainEntity> {
    const ormEntity = this.repository.create(
      InvitationCompteMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return InvitationCompteMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<InvitationCompteDomainEntity>,
  ): Promise<InvitationCompteDomainEntity> {
    await this.repository.update(
      id,
      InvitationCompteMapper.toPersistence(
        entity as InvitationCompteDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return InvitationCompteMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
