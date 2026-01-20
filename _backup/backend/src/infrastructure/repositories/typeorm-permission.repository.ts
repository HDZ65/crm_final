import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PermissionRepositoryPort } from '../../core/port/permission-repository.port';
import type { PermissionEntity as PermissionDomainEntity } from '../../core/domain/permission.entity';
import { PermissionEntity as PermissionOrmEntity } from '../db/entities/permission.entity';
import { PermissionMapper } from '../../applications/mapper/permission.mapper';

@Injectable()
export class TypeOrmPermissionRepository implements PermissionRepositoryPort {
  constructor(
    @InjectRepository(PermissionOrmEntity)
    private readonly repository: Repository<PermissionOrmEntity>,
  ) {}

  async findById(id: string): Promise<PermissionDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? PermissionMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<PermissionDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => PermissionMapper.toDomain(entity));
  }

  async create(
    entity: PermissionDomainEntity,
  ): Promise<PermissionDomainEntity> {
    const ormEntity = this.repository.create(
      PermissionMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return PermissionMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<PermissionDomainEntity>,
  ): Promise<PermissionDomainEntity> {
    await this.repository.update(
      id,
      PermissionMapper.toPersistence(entity as PermissionDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return PermissionMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
