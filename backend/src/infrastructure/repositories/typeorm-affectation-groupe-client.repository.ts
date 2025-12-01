import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AffectationGroupeClientRepositoryPort } from '../../core/port/affectation-groupe-client-repository.port';
import type { AffectationGroupeClientEntity as AffectationGroupeClientDomainEntity } from '../../core/domain/affectation-groupe-client.entity';
import { AffectationGroupeClientEntity as AffectationGroupeClientOrmEntity } from '../db/entities/affectation-groupe-client.entity';
import { AffectationGroupeClientMapper } from '../../applications/mapper/affectation-groupe-client.mapper';

@Injectable()
export class TypeOrmAffectationGroupeClientRepository
  implements AffectationGroupeClientRepositoryPort
{
  constructor(
    @InjectRepository(AffectationGroupeClientOrmEntity)
    private readonly repository: Repository<AffectationGroupeClientOrmEntity>,
  ) {}

  async findById(
    id: string,
  ): Promise<AffectationGroupeClientDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? AffectationGroupeClientMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<AffectationGroupeClientDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) =>
      AffectationGroupeClientMapper.toDomain(entity),
    );
  }

  async create(
    entity: AffectationGroupeClientDomainEntity,
  ): Promise<AffectationGroupeClientDomainEntity> {
    const ormEntity = this.repository.create(
      AffectationGroupeClientMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return AffectationGroupeClientMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<AffectationGroupeClientDomainEntity>,
  ): Promise<AffectationGroupeClientDomainEntity> {
    await this.repository.update(
      id,
      AffectationGroupeClientMapper.toPersistence(
        entity as AffectationGroupeClientDomainEntity,
      ),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return AffectationGroupeClientMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
