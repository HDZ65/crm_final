import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TypeActiviteRepositoryPort } from '../../core/port/type-activite-repository.port';
import type { TypeActiviteEntity as TypeActiviteDomainEntity } from '../../core/domain/type-activite.entity';
import { TypeActiviteEntity as TypeActiviteOrmEntity } from '../db/entities/type-activite.entity';
import { TypeActiviteMapper } from '../../applications/mapper/type-activite.mapper';

@Injectable()
export class TypeOrmTypeActiviteRepository
  implements TypeActiviteRepositoryPort
{
  constructor(
    @InjectRepository(TypeActiviteOrmEntity)
    private readonly repository: Repository<TypeActiviteOrmEntity>,
  ) {}

  async findById(id: string): Promise<TypeActiviteDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? TypeActiviteMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<TypeActiviteDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => TypeActiviteMapper.toDomain(entity));
  }

  async create(
    entity: TypeActiviteDomainEntity,
  ): Promise<TypeActiviteDomainEntity> {
    const ormEntity = this.repository.create(
      TypeActiviteMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return TypeActiviteMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<TypeActiviteDomainEntity>,
  ): Promise<TypeActiviteDomainEntity> {
    await this.repository.update(
      id,
      TypeActiviteMapper.toPersistence(entity as TypeActiviteDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return TypeActiviteMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
