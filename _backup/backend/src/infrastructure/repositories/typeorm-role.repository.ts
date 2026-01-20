import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RoleRepositoryPort } from '../../core/port/role-repository.port';
import type { RoleEntity as RoleDomainEntity } from '../../core/domain/role.entity';
import { RoleEntity as RoleOrmEntity } from '../db/entities/role.entity';
import { RoleMapper } from '../../applications/mapper/role.mapper';

@Injectable()
export class TypeOrmRoleRepository implements RoleRepositoryPort {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly repository: Repository<RoleOrmEntity>,
  ) {}

  async findById(id: string): Promise<RoleDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? RoleMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<RoleDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => RoleMapper.toDomain(entity));
  }

  async create(entity: RoleDomainEntity): Promise<RoleDomainEntity> {
    const ormEntity = this.repository.create(RoleMapper.toPersistence(entity));
    const saved = await this.repository.save(ormEntity);
    return RoleMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<RoleDomainEntity>,
  ): Promise<RoleDomainEntity> {
    await this.repository.update(
      id,
      RoleMapper.toPersistence(entity as RoleDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return RoleMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
