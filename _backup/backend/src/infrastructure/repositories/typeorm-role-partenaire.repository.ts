import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RolePartenaireRepositoryPort } from '../../core/port/role-partenaire-repository.port';
import type { RolePartenaireEntity as RolePartenaireDomainEntity } from '../../core/domain/role-partenaire.entity';
import { RolePartenaireEntity as RolePartenaireOrmEntity } from '../db/entities/role-partenaire.entity';
import { RolePartenaireMapper } from '../../applications/mapper/role-partenaire.mapper';

@Injectable()
export class TypeOrmRolePartenaireRepository implements RolePartenaireRepositoryPort {
  constructor(
    @InjectRepository(RolePartenaireOrmEntity)
    private readonly repository: Repository<RolePartenaireOrmEntity>,
  ) {}

  async findById(id: string): Promise<RolePartenaireDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? RolePartenaireMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<RolePartenaireDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => RolePartenaireMapper.toDomain(entity));
  }

  async create(
    entity: RolePartenaireDomainEntity,
  ): Promise<RolePartenaireDomainEntity> {
    const ormEntity = this.repository.create(
      RolePartenaireMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return RolePartenaireMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<RolePartenaireDomainEntity>,
  ): Promise<RolePartenaireDomainEntity> {
    await this.repository.update(
      id,
      RolePartenaireMapper.toPersistence(entity as RolePartenaireDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return RolePartenaireMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
