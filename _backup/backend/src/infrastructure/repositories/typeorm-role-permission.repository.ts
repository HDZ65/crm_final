import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RolePermissionRepositoryPort } from '../../core/port/role-permission-repository.port';
import type { RolePermissionEntity as RolePermissionDomainEntity } from '../../core/domain/role-permission.entity';
import { RolePermissionEntity as RolePermissionOrmEntity } from '../db/entities/role-permission.entity';
import { RolePermissionMapper } from '../../applications/mapper/role-permission.mapper';

@Injectable()
export class TypeOrmRolePermissionRepository implements RolePermissionRepositoryPort {
  constructor(
    @InjectRepository(RolePermissionOrmEntity)
    private readonly repository: Repository<RolePermissionOrmEntity>,
  ) {}

  async findById(id: string): Promise<RolePermissionDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? RolePermissionMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<RolePermissionDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => RolePermissionMapper.toDomain(entity));
  }

  async create(
    entity: RolePermissionDomainEntity,
  ): Promise<RolePermissionDomainEntity> {
    const ormEntity = this.repository.create(
      RolePermissionMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return RolePermissionMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<RolePermissionDomainEntity>,
  ): Promise<RolePermissionDomainEntity> {
    await this.repository.update(
      id,
      RolePermissionMapper.toPersistence(entity as RolePermissionDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return RolePermissionMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
